'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

interface Score {
  id: string;
  juror_id: string;
  story_score: number | null;
  growth_potential_score: number | null;
  jury_notes: string | null;
  is_finalized: boolean;
  juror?: {
    full_name: string;
    organization: string | null;
    jury_seat_color: string | null;
  };
}

const SEAT_COLORS: Record<string, string> = {
  coral: 'bg-coral text-white',
  teal: 'bg-teal text-white',
  burgundy: 'bg-burgundy text-white',
  gold: 'bg-gold text-navy',
};

export function ScoringPanel({
  applicationId,
  existingScores,
  currentUserId: currentUserIdProp,
}: {
  applicationId: string;
  existingScores: Score[];
  currentUserId?: string | null;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(currentUserIdProp || null);
  const [storyScore, setStoryScore] = useState<number | null>(null);
  const [growthScore, setGrowthScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    // If we got the user ID as a prop (from server-side), use it directly.
    // Otherwise, try to fetch it client-side (legacy fallback).
    if (currentUserIdProp) {
      const myScore = existingScores.find((s) => s.juror_id === currentUserIdProp);
      if (myScore) {
        setStoryScore(myScore.story_score);
        setGrowthScore(myScore.growth_potential_score);
        setNotes(myScore.jury_notes || '');
      }
      return;
    }

    // Fallback: client-side auth lookup
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('ScoringPanel: no authenticated user');
          return;
        }
        const { data: admin } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle();
        if (admin) {
          setCurrentUserId(admin.id);
          const myScore = existingScores.find((s) => s.juror_id === admin.id);
          if (myScore) {
            setStoryScore(myScore.story_score);
            setGrowthScore(myScore.growth_potential_score);
            setNotes(myScore.jury_notes || '');
          }
        } else {
          console.warn('ScoringPanel: user not in admin_users:', user.email);
        }
      } catch (err) {
        console.error('ScoringPanel auth lookup failed:', err);
      }
    })();
  }, [existingScores, currentUserIdProp]);

  const save = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.from('jury_scores').upsert(
        {
          application_id: applicationId,
          juror_id: currentUserId,
          story_score: storyScore,
          growth_potential_score: growthScore,
          jury_notes: notes,
        },
        { onConflict: 'application_id,juror_id' }
      );
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Compute aggregate
  const myScore = existingScores.find((s) => s.juror_id === currentUserId);
  const otherScores = existingScores.filter((s) => s.juror_id !== currentUserId);

  const avgStory =
    otherScores.length > 0
      ? otherScores.reduce((sum, s) => sum + (s.story_score || 0), 0) / otherScores.length
      : null;
  const avgGrowth =
    otherScores.length > 0
      ? otherScores.reduce((sum, s) => sum + (s.growth_potential_score || 0), 0) / otherScores.length
      : null;

  return (
    <div className="space-y-4">
      {/* My scoring */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-coral">
          Your scoring
        </h3>

        <ScoreSlider
          label="Story (50% weight)"
          value={storyScore}
          onChange={setStoryScore}
          color="coral"
        />
        <ScoreSlider
          label="Growth Potential (30%)"
          value={growthScore}
          onChange={setGrowthScore}
          color="teal"
        />

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-navy">Notes (private)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Your private notes..."
            className="w-full resize-none rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving || !currentUserId}
          className="mt-4 w-full rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save scores'}
        </button>
        {!currentUserId && (
          <p className="mt-2 text-center text-[11px] text-burgundy">
            ⚠ Could not identify your admin account. Try refreshing the page.
          </p>
        )}
        {savedAt && (
          <p className="mt-2 text-center text-[11px] text-warm-gray">Saved at {savedAt}</p>
        )}
      </div>

      {/* Other jurors */}
      {otherScores.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
            Other jurors
          </h3>
          <div className="space-y-3">
            {otherScores.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-xl bg-cream p-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    SEAT_COLORS[s.juror?.jury_seat_color || 'coral'] || 'bg-warm-gray text-white'
                  }`}
                >
                  {s.juror?.full_name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-navy">{s.juror?.full_name}</div>
                  <div className="text-[11px] text-warm-gray">{s.juror?.organization}</div>
                  <div className="mt-1.5 flex gap-3 text-xs">
                    <span>
                      <strong className="text-navy">{s.story_score ?? '—'}</strong>
                      <span className="text-warm-gray"> story</span>
                    </span>
                    <span>
                      <strong className="text-navy">{s.growth_potential_score ?? '—'}</strong>
                      <span className="text-warm-gray"> growth</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {avgStory !== null && avgGrowth !== null && (
            <div className="mt-4 rounded-xl bg-navy p-3 text-cream">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gold">
                Aggregate (excl. you)
              </div>
              <div className="mt-1 flex gap-4 text-sm">
                <span>
                  <strong>{avgStory.toFixed(1)}</strong>
                  <span className="text-cream/70"> story</span>
                </span>
                <span>
                  <strong>{avgGrowth.toFixed(1)}</strong>
                  <span className="text-cream/70"> growth</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  color: 'coral' | 'teal';
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-bold text-navy">{label}</label>
        <span className="font-mono text-sm font-bold text-navy">{value ?? '—'}/10</span>
      </div>
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`h-8 rounded-md border text-[11px] font-bold transition-all ${
              value === i
                ? color === 'coral'
                  ? 'border-coral bg-coral text-white'
                  : 'border-teal bg-teal text-white'
                : 'border-line bg-white text-navy hover:border-coral'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}
