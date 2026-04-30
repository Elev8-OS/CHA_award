'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { categoryColors, getInitials } from '@/lib/utils';

interface Applicant {
  id: string;
  public_slug: string | null;
  full_name: string | null;
  business_name: string | null;
  category: 'boutique' | 'growing' | 'scaled' | null;
  location: string | null;
  hero_photo_url: string | null;
  vote_count: number;
  category_rank: number;
  view_count: number;
  share_count: number;
}

export function LeaderboardClient({ initialApplicants }: { initialApplicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initialApplicants);
  const [pulseId, setPulseId] = useState<string | null>(null);

  // Subscribe to vote_events for live updates across ALL applicants
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel('leaderboard-votes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vote_events' },
        (payload) => {
          const newVote = payload.new as any;
          if (!newVote?.is_verified) return;
          handleNewVote(newVote.application_id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vote_events' },
        (payload) => {
          const newVote = payload.new as any;
          const oldVote = payload.old as any;
          if (newVote?.is_verified && !oldVote?.is_verified) {
            handleNewVote(newVote.application_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

    function handleNewVote(appId: string) {
      setApplicants((prev) => {
        const updated = prev.map((a) =>
          a.id === appId ? { ...a, vote_count: a.vote_count + 1 } : a
        );
        return recomputeRanks(updated);
      });
      setPulseId(appId);
      setTimeout(() => setPulseId(null), 1500);
    }
  }, []);

  const byCategory = {
    boutique: applicants.filter((a) => a.category === 'boutique'),
    growing: applicants.filter((a) => a.category === 'growing'),
    scaled: applicants.filter((a) => a.category === 'scaled'),
  };

  return (
    <div className="space-y-12">
      <CategoryRanking
        title="Boutique"
        subtitle="1 — 3 villas"
        color="boutique"
        applicants={byCategory.boutique.slice(0, 10)}
        pulseId={pulseId}
      />
      <CategoryRanking
        title="Growing"
        subtitle="4 — 9 villas"
        color="growing"
        applicants={byCategory.growing.slice(0, 10)}
        pulseId={pulseId}
      />
      <CategoryRanking
        title="Scaled"
        subtitle="10+ villas"
        color="scaled"
        applicants={byCategory.scaled.slice(0, 10)}
        pulseId={pulseId}
      />
    </div>
  );
}

function CategoryRanking({
  title,
  subtitle,
  color,
  applicants,
  pulseId,
}: {
  title: string;
  subtitle: string;
  color: keyof typeof categoryColors;
  applicants: Applicant[];
  pulseId: string | null;
}) {
  const colors = categoryColors[color];

  return (
    <div>
      <div className={`mb-5 flex items-baseline gap-3 border-b-2 pb-2 ${colors.border}`}>
        <h2 className={`font-serif text-3xl ${colors.text}`}>{title}</h2>
        <span className="text-sm text-warm-gray">{subtitle}</span>
        <span className="ml-auto text-xs text-warm-gray">{applicants.length} ranked</span>
      </div>

      {applicants.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-warm-gray">
          No applicants in this category yet.
        </div>
      ) : (
        <div className="space-y-2">
          {applicants.map((a, idx) => (
            <LeaderboardRow
              key={a.id}
              applicant={a}
              rank={idx + 1}
              colors={colors}
              isPulsing={pulseId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  applicant,
  rank,
  colors,
  isPulsing,
}: {
  applicant: Applicant;
  rank: number;
  colors: { bg: string; text: string; border: string; light: string };
  isPulsing: boolean;
}) {
  const isTop5 = rank <= 5;
  const isTop3 = rank <= 3;

  return (
    <Link
      href={`/v/${applicant.public_slug}`}
      className={`relative flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isPulsing
          ? 'border-gold shadow-[0_0_20px_rgba(232,169,60,0.4)]'
          : isTop5
          ? colors.border
          : 'border-line'
      }`}
    >
      {/* Rank badge */}
      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-serif text-xl ${
          isTop3
            ? `${colors.bg} text-white`
            : isTop5
            ? `${colors.light} ${colors.text}`
            : 'bg-cream text-warm-gray'
        }`}
      >
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </div>

      {/* Photo or initials */}
      {applicant.hero_photo_url ? (
        <img
          src={applicant.hero_photo_url}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-serif text-base italic text-white ${colors.bg}`}
        >
          {getInitials(applicant.business_name || applicant.full_name)}
        </div>
      )}

      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-bold text-navy">
          {applicant.business_name || applicant.full_name}
        </div>
        <div className="truncate text-xs text-warm-gray">
          {applicant.location || '—'}
        </div>
      </div>

      {/* Vote count */}
      <div className="text-right">
        <div
          className={`font-serif text-2xl leading-none ${colors.text} transition-transform ${
            isPulsing ? 'scale-125' : 'scale-100'
          }`}
        >
          {applicant.vote_count}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
          votes
        </div>
      </div>
    </Link>
  );
}

// Re-rank within categories after a new vote
function recomputeRanks(applicants: Applicant[]): Applicant[] {
  const byCategory: Record<string, Applicant[]> = {
    boutique: [],
    growing: [],
    scaled: [],
  };
  applicants.forEach((a) => {
    if (a.category) byCategory[a.category]?.push(a);
  });

  // Sort each category by vote_count desc
  Object.keys(byCategory).forEach((cat) => {
    byCategory[cat].sort((x, y) => y.vote_count - x.vote_count);
    byCategory[cat].forEach((a, idx) => {
      a.category_rank = idx + 1;
    });
  });

  return [...byCategory.boutique, ...byCategory.growing, ...byCategory.scaled];
}
