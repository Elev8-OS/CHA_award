'use client';

import { useState, useRef } from 'react';
import type { Locale } from '@/lib/i18n/translations';

interface PhotoUploadProps {
  continueToken: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  locale: Locale;
}

export function PhotoUpload({
  continueToken,
  currentUrl,
  onUploaded,
  onRemoved,
  locale,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError(locale === 'id' ? 'Hanya file gambar.' : 'Image files only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(locale === 'id' ? 'Maks 5MB.' : 'Max 5MB.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('continue_token', continueToken);

      const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUploaded(data.url);
    } catch (e: any) {
      setError(e.message || (locale === 'id' ? 'Gagal upload.' : 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(locale === 'id' ? 'Hapus foto?' : 'Remove photo?')) return;
    setUploading(true);
    try {
      await fetch(`/api/upload/photo?token=${encodeURIComponent(continueToken)}`, {
        method: 'DELETE',
      });
      onRemoved();
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy">
        {locale === 'id' ? 'Foto profil (untuk halaman publik)' : 'Profile photo (for public page)'}
      </label>

      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt=""
            className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-sm text-white shadow-md hover:bg-coral disabled:opacity-50"
            aria-label={locale === 'id' ? 'Hapus' : 'Remove'}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-white px-6 py-8 text-center transition-colors ${
            dragOver
              ? 'border-coral bg-coral/5'
              : 'border-line hover:border-coral/50 hover:bg-cream'
          } disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <div className="text-2xl">⏳</div>
              <div className="text-sm font-semibold text-navy">
                {locale === 'id' ? 'Mengunggah...' : 'Uploading...'}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl">📸</div>
              <div className="text-sm font-semibold text-navy">
                {locale === 'id' ? 'Klik atau tarik foto' : 'Click or drop a photo'}
              </div>
              <div className="text-xs text-warm-gray">JPG, PNG, WebP · max 5MB</div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // allow re-selecting same file
        }}
      />

      {error && <p className="mt-2 text-xs text-burgundy">{error}</p>}
      <p className="mt-1.5 text-xs text-warm-gray">
        {locale === 'id'
          ? 'Opsional — tapi halaman publik dengan foto mendapat 3× lebih banyak suara.'
          : 'Optional — but public pages with photos get 3× more votes.'}
      </p>
    </div>
  );
}
