// ============================================================================
// /winners — Live from 27 May 2026
// Hall of fame for Edition 01
// ============================================================================

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CHALogo } from '@/components/common/CHALogo';
import { categoryColors, getInitials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const REVEAL_AT = new Date(process.env.WINNERS_REVEAL_AT || '2026-05-26T15:00:00+08:00');

async function getWinners() {
  const { data } = await supabaseAdmin
    .from('applications')
    .select('id, public_slug, full_name, business_name, category, location, hero_photo_url, short_pitch, why_you')
    .eq('status', 'winner')
    .eq('is_public', true);
  return data || [];
}

export default async function WinnersPage() {
  const isRevealed = Date.now() >= REVEAL_AT.getTime();
  const winners = isRevealed ? await getWinners() : [];

  const winnersByCategory: Record<string, any> = {
    boutique: winners.find((w) => w.category === 'boutique'),
    growing: winners.find((w) => w.category === 'growing'),
    scaled: winners.find((w) => w.category === 'scaled'),
  };

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={36} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-extrabold tracking-wider text-navy">CANGGU</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
                Hospitality Association
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-cream"
          >
            ← Home
          </Link>
        </div>
      </header>

      {!isRevealed ? (
        <RevealLockup />
      ) : (
        <section className="px-5 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-gold">
              Hall of Fame · Edition 01
            </div>
            <h1 className="mb-7 font-serif text-[clamp(40px,7vw,84px)] leading-[0.95] tracking-tight text-navy">
              The <span className="italic text-coral">Winners</span>.
            </h1>
            <p className="mb-16 max-w-[640px] text-lg leading-relaxed text-navy/80">
              Three operators. Three categories. Selected by jury, decided by community. Edition 01
              of the Canggu Host Awards.
            </p>

            <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
              <WinnerCard winner={winnersByCategory.boutique} category="boutique" categoryName="Boutique" categoryRange="1—3 villas" />
              <WinnerCard winner={winnersByCategory.growing} category="growing" categoryName="Growing" categoryRange="4—9 villas" />
              <WinnerCard winner={winnersByCategory.scaled} category="scaled" categoryName="Scaled" categoryRange="10+ villas" />
            </div>

            <div className="mt-20 rounded-3xl bg-navy px-9 py-14 text-center text-cream">
              <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                Edition 02 · 2027
              </div>
              <h2 className="mb-5 font-serif text-4xl">The tradition continues.</h2>
              <p className="mx-auto mb-9 max-w-xl text-base text-cream/80">
                The Canggu Host Awards return next year. Bigger, with more categories, and the same
                ethos: peers, not vendors.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-sm font-bold text-navy hover:bg-cream"
              >
                Stay in the loop
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function RevealLockup() {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-7 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-4xl">
          🏆
        </div>
        <h1 className="mb-7 font-serif text-[clamp(40px,7vw,72px)] leading-tight tracking-tight text-navy">
          Winners revealed<br />
          <span className="italic text-coral">on stage</span>.
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-navy/80">
          The three winners of Edition 01 will be announced live on 26—27 May at Bali Villa Connect
          2026. This page goes live immediately after.
        </p>
      </div>
    </section>
  );
}

function WinnerCard({
  winner,
  category,
  categoryName,
  categoryRange,
}: {
  winner: any;
  category: 'boutique' | 'growing' | 'scaled';
  categoryName: string;
  categoryRange: string;
}) {
  const colors = categoryColors[category];

  if (!winner) {
    return (
      <div className={`rounded-3xl border-2 border-dashed border-line bg-white p-9 text-center`}>
        <div className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${colors.text}`}>
          {categoryName} · {categoryRange}
        </div>
        <div className="text-sm text-warm-gray">To be announced</div>
      </div>
    );
  }

  return (
    <Link
      href={`/v/${winner.public_slug}`}
      className="block overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(31,58,79,0.15)] transition-all hover:-translate-y-1"
    >
      <div className={`p-9 text-white`} style={{
        background:
          category === 'boutique'
            ? 'linear-gradient(135deg, #D4663F 0%, #B5532F 100%)'
            : category === 'growing'
            ? 'linear-gradient(135deg, #1F8A7A 0%, #176F62 100%)'
            : 'linear-gradient(135deg, #7A2935 0%, #5C1F28 100%)',
      }}>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
          🏆 Winner · {categoryName}
        </div>
        <div className="mb-5 text-xs text-white/70">{categoryRange}</div>
        <div className="mb-3 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-3 border-white/40 bg-white/15 font-serif text-2xl italic">
            {getInitials(winner.business_name || winner.full_name)}
          </div>
          <h3 className="font-serif text-2xl leading-tight">{winner.business_name}</h3>
        </div>
        {winner.location && <div className="text-sm text-white/85">📍 {winner.location}</div>}
      </div>
      {winner.short_pitch && (
        <div className="p-7 text-sm leading-relaxed italic text-navy/85">
          "{winner.short_pitch}"
        </div>
      )}
    </Link>
  );
}
