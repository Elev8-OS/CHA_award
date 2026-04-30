'use client';

import { useState, useRef, useEffect } from 'react';
import type { Locale } from '@/lib/i18n/translations';

interface VoiceRecorderProps {
  continueToken: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  locale: Locale;
}

const MAX_DURATION_SEC = 30;

export function VoiceRecorder({
  continueToken,
  currentUrl,
  onUploaded,
  onRemoved,
  locale,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setError('');
    setPreviewUrl(null);
    setPreviewBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Pick best supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedType || 'audio/webm' });
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
      };

      recorder.start();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION_SEC) {
            stopRecording();
            return MAX_DURATION_SEC;
          }
          return d + 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(
        e.name === 'NotAllowedError'
          ? locale === 'id'
            ? 'Akses mikrofon ditolak.'
            : 'Microphone access denied.'
          : e.message || 'Recording failed'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setRecording(false);
  };

  const discardPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setDuration(0);
  };

  const uploadPreview = async () => {
    if (!previewBlob) return;
    setUploading(true);
    setError('');

    try {
      // Determine extension from mime type
      const ext = previewBlob.type.includes('webm')
        ? 'webm'
        : previewBlob.type.includes('mp4')
        ? 'm4a'
        : previewBlob.type.includes('ogg')
        ? 'ogg'
        : 'webm';
      const file = new File([previewBlob], `voice.${ext}`, { type: previewBlob.type });

      const fd = new FormData();
      fd.append('file', file);
      fd.append('continue_token', continueToken);

      const res = await fetch('/api/upload/voice', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUploaded(data.url);
      discardPreview();
    } catch (e: any) {
      setError(e.message || (locale === 'id' ? 'Gagal upload.' : 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const removeUploaded = async () => {
    if (!confirm(locale === 'id' ? 'Hapus rekaman?' : 'Remove recording?')) return;
    setUploading(true);
    try {
      await fetch(`/api/upload/voice?token=${encodeURIComponent(continueToken)}`, {
        method: 'DELETE',
      });
      onRemoved();
    } finally {
      setUploading(false);
    }
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy">
        {locale === 'id' ? 'Pesan suara pribadi (opsional, maks 30 detik)' : 'Personal voice message (optional, max 30s)'}
      </label>

      <p className="mb-3 text-xs text-warm-gray">
        {locale === 'id'
          ? 'Rekam permintaan singkat untuk dukungan. Akan ditampilkan di halaman publik Anda.'
          : 'Record a short personal plea for support. Plays on your public page.'}
      </p>

      {currentUrl && !previewUrl && !recording ? (
        // ---------- Existing uploaded voice ----------
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              🎙️
            </div>
            <audio src={currentUrl} controls className="flex-1" />
            <button
              type="button"
              onClick={removeUploaded}
              disabled={uploading}
              className="text-xs font-bold text-burgundy hover:text-coral disabled:opacity-50"
            >
              {locale === 'id' ? 'Hapus' : 'Remove'}
            </button>
          </div>
        </div>
      ) : previewUrl ? (
        // ---------- Preview before upload ----------
        <div className="rounded-2xl border-2 border-coral bg-coral/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral text-white">
              ▶
            </div>
            <audio src={previewUrl} controls className="flex-1" />
            <span className="font-mono text-xs text-warm-gray">{fmtTime(duration)}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={uploadPreview}
              disabled={uploading}
              className="flex-1 rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white hover:bg-burgundy disabled:opacity-50"
            >
              {uploading ? (locale === 'id' ? 'Mengunggah...' : 'Uploading...') : locale === 'id' ? '✓ Gunakan ini' : '✓ Use this'}
            </button>
            <button
              type="button"
              onClick={discardPreview}
              disabled={uploading}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
            >
              {locale === 'id' ? 'Rekam ulang' : 'Re-record'}
            </button>
          </div>
        </div>
      ) : recording ? (
        // ---------- Currently recording ----------
        <div className="rounded-2xl border-2 border-burgundy bg-burgundy/5 p-5 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-burgundy" />
            <span className="font-mono text-2xl font-bold text-burgundy">
              {fmtTime(duration)} / {fmtTime(MAX_DURATION_SEC)}
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full bg-burgundy transition-all duration-1000"
              style={{ width: `${(duration / MAX_DURATION_SEC) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-xl bg-burgundy px-6 py-2.5 text-sm font-bold text-white hover:bg-coral"
          >
            ⏹ {locale === 'id' ? 'Stop' : 'Stop'}
          </button>
        </div>
      ) : (
        // ---------- Idle - start button ----------
        <button
          type="button"
          onClick={startRecording}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white px-6 py-6 text-sm font-semibold text-navy transition-colors hover:border-coral/50 hover:bg-cream"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white">
            🎙️
          </span>
          <span>{locale === 'id' ? 'Mulai rekaman' : 'Start recording'}</span>
        </button>
      )}

      {error && <p className="mt-2 text-xs text-burgundy">{error}</p>}
    </div>
  );
}
