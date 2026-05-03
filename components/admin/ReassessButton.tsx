'use client';

import { useState } from 'react';

export function ReassessButton({
  applicationId,
  hasExisting,
}: {
  applicationId: string;
  hasExisting: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (hasExisting) {
      const ok = confirm(
        'Re-run AI assessment? This will overwrite existing scores, summary, and follow-up questions. The applicant will not be notified.'
      );
      if (!ok) return;
    }

    setRunning(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/reassess`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Re-run failed');
      }
      // Reload to show fresh data
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setRunning(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={running}
        className="w-full rounded-full border border-coral/40 bg-white px-4 py-2 text-xs font-bold text-coral transition-all hover:bg-coral hover:text-white disabled:opacity-50"
      >
        {running ? '🤖 Running AI...' : hasExisting ? '🔄 Re-run AI assessment' : '🤖 Run AI assessment'}
      </button>
      {error && (
        <p className="mt-2 rounded-lg border border-burgundy/20 bg-burgundy/5 px-3 py-2 text-[11px] text-burgundy">
          ⚠ {error}
        </p>
      )}
      {running && (
        <p className="mt-2 text-center text-[10px] text-warm-gray">
          Takes 3-8 seconds. Page reloads when done.
        </p>
      )}
    </div>
  );
}
