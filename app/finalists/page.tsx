// ============================================================================
// /finalists — Live from 25 May 2026
// Shows top 5 per category with vote counts
// ============================================================================

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CHALogo } from '@/components/common/CHALogo';
import { categoryColors, getInitials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const REVEAL_AT = new Date(process.env.FINALISTS_REVEAL_AT || '2026-05-25T18:00:00+08:00');

async function getFinalists() {
  const { data } = await supabaseAdmin
    .from('public_applicant_view')
    .select('*')
    .eq('is_public', true)
    .order('vote_count', { ascending: false });
  return data || [];
}

export default async function FinalistsPage() {
  const isRevealed = Date.now() >= REVEAL_AT.getTime();
  const finalists = isRevealed ? await getFinalists() : [];

  // Group by category, top 5 each
  const byCategory: Record<string, any[]> = {
    boutique: [],
    growing: [],
    scaled: [],
  };
  finalists.forEach((a) => {
    if (a.category && byCategory[a.category]?.length < 5) {
      byCategory[a.category]?.push(a);
    }
  });

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
            <div className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-coral">
              The Top 5 · Edition 01
            </div>
            <h1 className="mb-7 font-serif text-[clamp(40px,7vw,84px)] leading-[0.95] tracking-tight text-navy">
              The <span className="italic text-coral">Finalists</span>.
            </h1>
            <p className="mb-16 max-w-[640px] text-lg leading-relaxed text-navy/80">
              Five finalists per category. Winners revealed live on stage at Bali Villa Connect on
              26—27 May.
            </p>

            <div className="space-y-16">
              <CategorySection title="Boutique" subtitle="1 — 3 villas" color="coral" applicants={byCategory.boutique} />
              <CategorySection title="Growing" subtitle="4 — 9 villas" color="teal" applicants={byCategory.growing} />
              <CategorySection title="Scaled" subtitle="10+ villas" color="burgundy" applicants={byCategory.scaled} />
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
          Finalists revealed<br />
          <span className="italic text-coral">25 May 2026</span>.
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-navy/80">
          The top 5 per category will be announced on the eve of Bali Villa Connect 2026. Winners
          named live on stage 26—27 May.
        </p>
        <div className="inline-flex flex-wrap items-center justify-center gap-4 rounded-full border-[1.5px] border-navy px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy">
          <span>Submissions close</span>
          <span className="opacity-30">·</span>
          <span>22 May 23:59 WITA</span>
        </div>
        <div className="mt-10">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2.5 rounded-full bg-coral px-9 py-[18px] text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-burgundy"
          >
            Start your application →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategorySection({
  title,
  subtitle,
  color,
  applicants,
}: {
  title: string;
  subtitle: string;
  color: 'coral' | 'teal' | 'burgundy';
  applicants: any[];
}) {
  const colors = categoryColors[color === 'coral' ? 'boutique' : color === 'teal' ? 'growing' : 'scaled'];

  return (
    <div>
      <div className="mb-7 flex items-baseline gap-4">
        <h2 className={`font-serif text-4xl tracking-tight ${colors.text}`}>{title}</h2>
        <span className="text-sm font-semibold text-warm-gray">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {applicants.length === 0 && (
          <div className="col-span-full rounded-2xl border border-line bg-white p-8 text-center text-sm text-warm-gray">
            No finalists in this category yet.
          </div>
        )}
        {applicants.map((a, idx) => (
          <Link
            key={a.id}
            href={`/v/${a.public_slug}`}
            className="rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(31,58,79,0.15)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full font-serif text-lg italic text-white ${colors.bg}`}
              >
                {getInitials(a.business_name || a.full_name)}
              </div>
              <span className="font-mono text-xs font-bold text-warm-gray">#{idx + 1}</span>
            </div>
            <div className="mb-1 line-clamp-1 font-serif text-lg leading-tight text-navy">
              {a.business_name}
            </div>
            <div className="mb-3 line-clamp-1 text-xs text-warm-gray">{a.location}</div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-navy">{a.vote_count || 0}</span>
              <span className="text-xs text-warm-gray">votes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
