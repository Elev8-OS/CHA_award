'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoryColors, getInitials } from '@/lib/utils';

interface Applicant {
  id: string;
  public_slug: string;
  full_name: string | null;
  business_name: string | null;
  category: 'boutique' | 'growing' | 'scaled' | null;
  location: string | null;
  villa_count: number | null;
  hero_photo_url: string | null;
  vote_count: number;
  jury_weighted_score: number | null;
  juror_count: number;
  status?: string;
}

export function FinalistsManager({ initialApplications }: { initialApplications: Applicant[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [confirmingNotify, setConfirmingNotify] = useState(false);

  const byCategory = {
    boutique: initialApplications.filter((a) => a.category === 'boutique'),
    growing: initialApplications.filter((a) => a.category === 'growing'),
    scaled: initialApplications.filter((a) => a.category === 'scaled'),
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllAsFinalists = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Mark ${selected.size} applicants as finalists? This is reversible but will affect public pages.`)) return;

    setBulkLoading(true);
    try {
      // Update each in parallel
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/admin/applications/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'finalist', notify: false }),
          })
        )
      );
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Some updates failed. Refresh and try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  const sendBulkNotification = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: Array.from(selected),
          template: 'finalist_notification',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setBulkResult({ succeeded: data.succeeded, failed: data.failed });
    } catch (e: any) {
      alert(`Bulk send failed: ${e.message}`);
    } finally {
      setBulkLoading(false);
      setConfirmingNotify(false);
    }
  };

  return (
    <div>
      {/* Action bar */}
      <div className="mb-7 sticky top-0 z-10 rounded-2xl border border-line bg-white p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <strong className="text-navy">{selected.size}</strong>{' '}
            <span className="text-warm-gray">selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0}
              className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-navy hover:bg-cream disabled:opacity-30"
            >
              Clear
            </button>
            <button
              onClick={markAllAsFinalists}
              disabled={selected.size === 0 || bulkLoading}
              className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-white hover:bg-burgundy disabled:opacity-50"
            >
              {bulkLoading ? '...' : 'Mark as Finalists'}
            </button>
            <button
              onClick={() => setConfirmingNotify(true)}
              disabled={selected.size === 0 || bulkLoading}
              className="rounded-full bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-dark disabled:opacity-50"
            >
              💬 Bulk Notify ({selected.size})
            </button>
          </div>
        </div>
        {bulkResult && (
          <div className="mt-2 rounded-lg bg-teal/10 p-2 text-xs text-teal">
            ✓ Sent: {bulkResult.succeeded} · Failed: {bulkResult.failed}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmingNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 font-serif text-2xl text-navy">Send finalist notification?</h3>
            <p className="mb-5 text-sm text-warm-gray">
              This sends the <code className="rounded bg-cream px-1">award_finalist_notification</code> template to{' '}
              <strong>{selected.size} applicants</strong> via WhatsApp.
              <br /><br />
              The template must be approved in Meta Business Manager. If not approved, falls back to text (only works in 24h window).
            </p>
            <div className="flex gap-2">
              <button
                onClick={sendBulkNotification}
                disabled={bulkLoading}
                className="flex-1 rounded-full bg-coral px-5 py-3 text-sm font-bold text-white hover:bg-burgundy disabled:opacity-50"
              >
                {bulkLoading ? 'Sending...' : `Confirm — send ${selected.size}`}
              </button>
              <button
                onClick={() => setConfirmingNotify(false)}
                disabled={bulkLoading}
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-10">
        <CategoryColumn
          title="Boutique · 1—3 villas"
          color="coral"
          applicants={byCategory.boutique}
          selected={selected}
          onToggle={toggle}
        />
        <CategoryColumn
          title="Growing · 4—9 villas"
          color="teal"
          applicants={byCategory.growing}
          selected={selected}
          onToggle={toggle}
        />
        <CategoryColumn
          title="Scaled · 10+ villas"
          color="burgundy"
          applicants={byCategory.scaled}
          selected={selected}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}

function CategoryColumn({
  title,
  color,
  applicants,
  selected,
  onToggle,
}: {
  title: string;
  color: 'coral' | 'teal' | 'burgundy';
  applicants: Applicant[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const catColors = categoryColors[color === 'coral' ? 'boutique' : color === 'teal' ? 'growing' : 'scaled'];

  return (
    <div>
      <div className={`mb-4 flex items-baseline gap-3 border-b-2 pb-2 ${catColors.border}`}>
        <h2 className={`font-serif text-2xl ${catColors.text}`}>{title}</h2>
        <span className="text-sm text-warm-gray">{applicants.length} applicants</span>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {applicants.map((a) => {
          const isSelected = selected.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle(a.id)}
              className={`relative flex items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition-all ${
                isSelected ? `${catColors.border} bg-cream` : 'border-line hover:border-line'
              }`}
            >
              {isSelected && (
                <div className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${catColors.bg}`}>
                  ✓
                </div>
              )}
              {a.hero_photo_url ? (
                <img src={a.hero_photo_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-serif text-base italic text-white ${catColors.bg}`}>
                  {getInitials(a.business_name || a.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-bold text-navy">{a.business_name}</div>
                <div className="flex gap-2 text-[11px] text-warm-gray">
                  <span>🗳 {a.vote_count}</span>
                  {a.jury_weighted_score !== null && (
                    <span>⚖ {a.jury_weighted_score.toFixed(1)} ({a.juror_count}j)</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {applicants.length === 0 && (
          <div className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-warm-gray">
            No applicants in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
