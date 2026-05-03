'use client';

import { useState } from 'react';

export function SendFollowupButton({
  applicationId,
  alreadySent,
}: {
  applicationId: string;
  alreadySent: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const msg = alreadySent
      ? 'A follow-up was already sent. Send again? The applicant will receive a duplicate.'
      : 'Send the follow-up email + WhatsApp now? This skips the 30-min scheduled delay.';
    if (!confirm(msg)) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/applications/${applicationId}/send-followup`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      const channels: string[] = [];
      if (data.emailSent) channels.push('Email');
      if (data.whatsappSent) channels.push('WhatsApp');
      alert(
        `✓ Sent ${data.questionCount} question(s) via ${channels.join(' + ')}.${
          data.errors?.length ? '\n\nNote: ' + data.errors.join(', ') : ''
        }`
      );
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={sending}
        className="w-full rounded-full border border-teal/40 bg-white px-4 py-2 text-xs font-bold text-teal transition-all hover:bg-teal hover:text-white disabled:opacity-50"
      >
        {sending
          ? '📤 Sending...'
          : alreadySent
          ? '🔄 Re-send follow-up'
          : '📤 Send follow-up now'}
      </button>
      {error && (
        <p className="mt-2 rounded-lg border border-burgundy/20 bg-burgundy/5 px-3 py-2 text-[11px] text-burgundy">
          ⚠ {error}
        </p>
      )}
      {sending && (
        <p className="mt-2 text-center text-[10px] text-warm-gray">
          Takes 2-5 seconds. Page reloads when done.
        </p>
      )}
    </div>
  );
}
