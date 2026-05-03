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
  const [saveError, setSaveError] = useState<string | null>(null);

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
    if (storyScore === null || growthScore === null) {
      setSaveError('Please set both Story and Growth scores before saving.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          story_score: storyScore,
          growth_score: growthScore,
          jury_notes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Save score error:', data);
        setSaveError(`Save failed: ${data.error || 'Unknown error'}`);
        return;
      }

      setSavedAt(new Date().toLocaleTimeString());
      // Reload page to refresh aggregates and "other jurors" panel
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e: any) {
      console.error(e);
      setSaveError(`Save failed: ${e.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // myScore reference for state init done above; aggregate is computed inside
  // the All jurors section below from existingScores directly.

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
          disabled={
            saving ||
            !currentUserId ||
            storyScore === null ||
            growthScore === null
          }
          className="mt-4 w-full rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save scores'}
        </button>
        {!currentUserId && (
          <p className="mt-2 text-center text-[11px] text-burgundy">
            ⚠ Could not identify your admin account. Try refreshing the page.
          </p>
        )}
        {currentUserId && (storyScore === null || growthScore === null) && (
          <p className="mt-2 text-center text-[11px] text-warm-gray">
            Set both scores to enable saving.
          </p>
        )}
        {saveError && (
          <p className="mt-2 text-center text-[11px] text-burgundy">
            {saveError}
          </p>
        )}
        {savedAt && !saveError && (
          <p className="mt-2 text-center text-[11px] text-teal">
            ✓ Saved at {savedAt} — refreshing...
          </p>
        )}
      </div>

      {/* All jurors view — full transparency */}
      {existingScores.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
            All juror scores ({existingScores.length})
          </h3>
          <p className="mb-4 text-[11px] text-warm-gray">
            Visible to all jury members for transparency. Includes notes.
          </p>
          <div className="space-y-3">
            {existingScores.map((s) => {
              const isMe = s.juror_id === currentUserId;
              const weighted =
                s.story_score !== null && s.growth_potential_score !== null
                  ? (s.story_score * 0.5 + s.growth_potential_score * 0.3).toFixed(2)
                  : null;
              return (
                <div
                  key={s.id}
                  className={`rounded-xl p-4 ${
                    isMe ? 'bg-coral/5 ring-1 ring-coral/30' : 'bg-cream'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        SEAT_COLORS[s.juror?.jury_seat_color || 'coral'] ||
                        'bg-warm-gray text-white'
                      }`}
                    >
                      {s.juror?.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-navy">
                          {s.juror?.full_name || 'Unknown juror'}
                        </div>
                        {isMe && (
                          <span className="rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            you
                          </span>
                        )}
                      </div>
                      {s.juror?.organization && (
                        <div className="text-[11px] text-warm-gray">{s.juror.organization}</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="rounded-md bg-white px-2 py-1">
                          <span className="text-warm-gray">Story</span>{' '}
                          <strong className="text-navy">
                            {s.story_score ?? '—'}
                            {s.story_score !== null && '/10'}
                          </strong>
                        </span>
                        <span className="rounded-md bg-white px-2 py-1">
                          <span className="text-warm-gray">Growth</span>{' '}
                          <strong className="text-navy">
                            {s.growth_potential_score ?? '—'}
                            {s.growth_potential_score !== null && '/10'}
                          </strong>
                        </span>
                        {weighted && (
                          <span className="rounded-md bg-coral/10 px-2 py-1">
                            <span className="text-warm-gray">Weighted</span>{' '}
                            <strong className="text-coral">{weighted}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.jury_notes && s.jury_notes.trim() && (
                    <div className="mt-3 rounded-lg border-l-2 border-coral/40 bg-white px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-warm-gray">
                        Notes
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-navy">
                        {s.jury_notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aggregate */}
          {(() => {
            const completeScores = existingScores.filter(
              (s) => s.story_score !== null && s.growth_potential_score !== null
            );
            if (completeScores.length === 0) return null;
            const avgStory =
              completeScores.reduce((sum, s) => sum + (s.story_score || 0), 0) /
              completeScores.length;
            const avgGrowth =
              completeScores.reduce(
                (sum, s) => sum + (s.growth_potential_score || 0),
                0
              ) / completeScores.length;
            const weighted = avgStory * 0.5 + avgGrowth * 0.3;
            return (
              <div className="mt-4 rounded-xl bg-navy p-4 text-cream">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Total ({completeScores.length}{' '}
                  {completeScores.length === 1 ? 'juror' : 'jurors'})
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="font-serif text-xl">{avgStory.toFixed(1)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-cream/60">
                      Story avg
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-xl">{avgGrowth.toFixed(1)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-cream/60">
                      Growth avg
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-xl text-gold">{weighted.toFixed(2)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-cream/60">
                      Weighted
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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
