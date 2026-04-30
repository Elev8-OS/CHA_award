'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-warm-gray' },
  { value: 'shortlisted', label: 'Shortlisted (Top 10)', color: 'bg-teal' },
  { value: 'finalist', label: 'Finalist (Top 5)', color: 'bg-coral' },
  { value: 'winner', label: 'Winner 🏆', color: 'bg-gold' },
  { value: 'rejected', label: 'Rejected', color: 'bg-burgundy' },
];

interface StatusTransitionProps {
  applicationId: string;
  currentStatus: string;
  hasWhatsApp: boolean;
}

export function StatusTransition({ applicationId, currentStatus, hasWhatsApp }: StatusTransitionProps) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const save = async () => {
    if (newStatus === currentStatus) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notify }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setMessage(notify ? 'Status updated + notification queued' : 'Status updated');
      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
        Status transition
      </h3>

      <div className="mb-3 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${currentOption?.color || 'bg-warm-gray'}`} />
        <span className="text-sm font-semibold capitalize text-navy">{currentStatus}</span>
      </div>

      <select
        value={newStatus}
        onChange={(e) => setNewStatus(e.target.value)}
        className="mb-3 w-full rounded-xl border-[1.5px] border-line bg-white px-3 py-2.5 text-sm focus:border-coral focus:outline-none"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {newStatus === 'finalist' && hasWhatsApp && (
        <label className="mb-3 flex cursor-pointer items-start gap-2 rounded-xl bg-cream p-3">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-coral"
          />
          <div className="text-xs">
            <div className="font-bold text-navy">Notify applicant via WhatsApp</div>
            <div className="text-warm-gray">
              Sends pre-approved finalist template
            </div>
          </div>
        </label>
      )}

      <button
        onClick={save}
        disabled={saving || newStatus === currentStatus}
        className="w-full rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
      >
        {saving ? 'Updating...' : `Set to ${newStatus}`}
      </button>

      {message && (
        <p
          className={`mt-3 text-center text-xs ${
            message.startsWith('Error') ? 'text-burgundy' : 'text-teal'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
