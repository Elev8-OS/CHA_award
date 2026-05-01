// ============================================================================
// /leaderboard — Public live ranking during voting period
// ============================================================================

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CHALogo } from '@/components/common/CHALogo';
import { LeaderboardClient } from '@/components/vote/LeaderboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLeaderboardData() {
  const { data } = await supabaseAdmin
    .from('public_applicant_view')
    .select('id, public_slug, full_name, business_name, category, location, hero_photo_url, vote_count, category_rank, view_count, share_count')
    .order('vote_count', { ascending: false });
  return data || [];
}

export default async function LeaderboardPage() {
  const applicants = await getLeaderboardData();
  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={48} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-extrabold tracking-wider text-navy">CANGGU</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
                Hospitality Association
              </span>
            </div>
          </Link>
          <Link
            href="/apply"
            className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-white hover:bg-burgundy"
          >
            Apply →
          </Link>
        </div>
      </header>

      <section className="px-5 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            Live · updating in real-time
          </div>
          <h1 className="mb-5 font-serif text-[clamp(40px,7vw,84px)] leading-[0.95] tracking-tight text-navy">
            The <span className="italic text-coral">Leaderboard</span>.
          </h1>
          <p className="mb-12 max-w-[640px] text-lg leading-relaxed text-navy/80">
            Every verified WhatsApp vote, ranked live by category. Voting closes <strong>22 May 23:59 WITA</strong>.
          </p>

          <LeaderboardClient initialApplicants={applicants} />
        </div>
      </section>
    </main>
  );
}
