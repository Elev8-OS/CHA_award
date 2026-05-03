'use client';

import Link from 'next/link';
import { useLang } from '@/components/common/LangProvider';
import { CHALogo } from '@/components/common/CHALogo';
import { elev8Link } from '@/lib/utils';

// ============================================================================
// PARTNERSHIP STRIP
// ============================================================================

export function PartnershipStrip() {
  const { t } = useLang();
  return (
    <div className="bg-navy px-4 py-7 text-cream md:px-8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-6 text-center md:grid-cols-3">
        <Partner tag={t('hero.presented_by')} name="Canggu Hospitality Association" />
        <Partner
          tag={t('hero.powered_by')}
          name="Elev8 Suite OS — Diamond Sponsor"
          href={elev8Link('partnership-strip')}
        />
        <Partner tag="Hosted at" name="Bali Villa Connect 2026" />
      </div>
    </div>
  );
}

function Partner({ tag, name, href }: { tag: string; name: string; href?: string }) {
  return (
    <div className="text-base font-semibold">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
        {tag}
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="underline decoration-gold/0 underline-offset-4 transition-all hover:decoration-gold"
        >
          {name}
        </a>
      ) : (
        name
      )}
    </div>
  );
}

// ============================================================================
// CATEGORIES
// ============================================================================

export function Categories() {
  const { t } = useLang();
  return (
    <section id="prize" className="mx-auto max-w-[1280px] px-4 py-24 md:px-8 md:py-28">
      <span className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-coral">
        {t('cat.section_eyebrow')}
      </span>
      <h2 className="mb-7 font-serif text-display-md leading-[0.98] tracking-[-0.02em] text-navy">
        {t('cat.title.line1')}
        <br />
        {t('cat.title.line2')} <span className="italic text-coral">{t('cat.title.winners')}</span>.
      </h2>
      <p className="mb-16 max-w-[720px] text-lg leading-[1.55] text-navy/80">{t('cat.lede')}</p>

      <div className="mb-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        <CategoryCard
          color="coral"
          tag="⬥ Boutique"
          range={t('cat.boutique.range')}
          name={t('cat.boutique.name')}
          desc={t('cat.boutique.desc')}
        />
        <CategoryCard
          color="teal"
          tag="⬥ Growing"
          range={t('cat.growing.range')}
          name={t('cat.growing.name')}
          desc={t('cat.growing.desc')}
        />
        <CategoryCard
          color="burgundy"
          tag="⬥ Scaled"
          range={t('cat.scaled.range')}
          name={t('cat.scaled.name')}
          desc={t('cat.scaled.desc')}
        />
      </div>

      <Tiers />
    </section>
  );
}

function CategoryCard({
  color,
  tag,
  range,
  name,
  desc,
}: {
  color: 'coral' | 'teal' | 'burgundy';
  tag: string;
  range: string;
  name: string;
  desc: string;
}) {
  const colors = {
    coral: { bar: 'bg-coral', tagBg: 'bg-coral/10 text-coral', dot: 'bg-coral' },
    teal: { bar: 'bg-teal', tagBg: 'bg-teal/10 text-teal', dot: 'bg-teal' },
    burgundy: { bar: 'bg-burgundy', tagBg: 'bg-burgundy/10 text-burgundy', dot: 'bg-burgundy' },
  }[color];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-9 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(31,58,79,0.15)]">
      <div className={`absolute left-0 right-0 top-0 h-1.5 ${colors.bar}`} />
      <span
        className={`mb-6 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${colors.tagBg}`}
      >
        {tag}
      </span>
      <div className="mb-2 text-sm font-semibold tracking-wide text-warm-gray">{range}</div>
      <h3 className="mb-1.5 font-serif text-3xl leading-[1.05] tracking-tight text-navy">{name}</h3>
      <p className="text-base italic leading-snug text-warm-gray">{desc}</p>
    </div>
  );
}

function Tiers() {
  const { t } = useLang();
  return (
    <div className="relative grid grid-cols-1 gap-12 overflow-hidden rounded-3xl bg-navy px-12 py-14 text-cream md:grid-cols-3 md:px-12">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[360px] w-[360px]"
        style={{
          background:
            'radial-gradient(circle, rgba(232, 169, 60, 0.18) 0%, transparent 70%)',
        }}
      />

      <Tier
        num="3"
        suffix="×"
        label={t('tier.top.label')}
        headline={t('tier.top.headline')}
        desc={t('tier.top.desc')}
        value={t('tier.top.value')}
      />
      <Tier
        num="5"
        label={t('tier.finalists.label')}
        headline={t('tier.finalists.headline')}
        desc={t('tier.finalists.desc')}
      />
      <Tier
        num="10"
        label={t('tier.recognized.label')}
        headline={t('tier.recognized.headline')}
        desc={t('tier.recognized.desc')}
      />
    </div>
  );
}

function Tier({
  num,
  suffix,
  label,
  headline,
  desc,
  value,
}: {
  num: string;
  suffix?: string;
  label: string;
  headline: string;
  desc: string;
  value?: string;
}) {
  return (
    <div className="relative z-10">
      <div className="mb-2 font-serif text-[110px] leading-[0.85] tracking-tight text-gold">
        {num}
        {suffix && <span className="italic text-coral">{suffix}</span>}
      </div>
      <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.16em] text-gold">{label}</div>
      <div className="mb-3.5 font-serif text-2xl italic leading-tight text-cream">{headline}</div>
      <p className="text-sm leading-[1.55] text-cream/75">{desc}</p>
      {value && (
        <span className="mt-4 inline-block rounded-full bg-gold px-3 py-1 text-[11px] font-bold tracking-wide text-navy">
          {value}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// STAGE
// ============================================================================

export function StageSection() {
  const { t } = useLang();
  return (
    <div
      className="relative overflow-hidden px-4 py-32 text-cream md:px-8"
      style={{
        background:
          'radial-gradient(ellipse at 50% 100%, rgba(232, 169, 60, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 0%, rgba(212, 102, 63, 0.1) 0%, transparent 50%), #1F3A4F',
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1080px] text-center">
        <span className="mb-8 inline-block text-xs font-bold uppercase tracking-[0.16em] text-gold">
          {t('stage.eyebrow')}
        </span>
        <h2 className="mb-9 font-serif text-display-lg leading-[0.95] tracking-[-0.02em]">
          {t('stage.title.line1')}
          <br />
          <span className="italic text-gold">{t('stage.title.stage')}</span>.
        </h2>
        <p className="mx-auto mb-12 max-w-[720px] text-xl leading-[1.6] text-cream/80">
          {t('stage.text')}
        </p>
        <div className="inline-flex flex-wrap items-center justify-center gap-4 rounded-full border-[1.5px] border-gold px-9 py-[18px] text-[13px] font-semibold uppercase tracking-wider text-gold md:gap-7">
          <span>26 — 27 May 2026</span>
          <span className="text-gold/35">·</span>
          <span>Bali Sunset Road Convention Center</span>
          <span className="text-gold/35">·</span>
          <span>Live Reveal</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENDORSEMENT (Pak Prima)
// ============================================================================

// ============================================================================
// ENDORSEMENT — Pak Prima's quote
// ============================================================================
// TO UPDATE: change PRIMA_QUOTE below with the real statement from Pak Prima.
// Both EN and ID versions can be set; if ID is empty string, EN shows for both.
// ============================================================================

const PRIMA_QUOTE = {
  en: '"Building connection, one conversation at a time. These awards are how we recognize the operators raising the standard of hospitality across Canggu."',
  id: '"Membangun koneksi, satu percakapan pada satu waktu. Award ini adalah cara kami mengenali para operator yang meningkatkan standar perhotelan di Canggu."',
};

export function Endorsement() {
  const { t, locale } = useLang();
  const quote = locale === 'id' && PRIMA_QUOTE.id ? PRIMA_QUOTE.id : PRIMA_QUOTE.en;
  const eyebrow = locale === 'id' ? 'Pesan dari Pendiri CHA' : 'A note from the CHA Founder';

  return (
    <div className="px-4 py-28 md:px-8">
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 overflow-hidden rounded-3xl border border-line bg-white p-14 shadow-[0_24px_60px_-20px_rgba(31,58,79,0.1)] md:grid-cols-[auto_1fr]">
        <div
          className="absolute -right-16 -top-16 h-56 w-56"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(212, 102, 63, 0.08) 0%, transparent 40%), radial-gradient(circle at 70% 30%, rgba(31, 138, 122, 0.08) 0%, transparent 40%), radial-gradient(circle at 30% 70%, rgba(122, 41, 53, 0.08) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(232, 169, 60, 0.1) 0%, transparent 40%)',
          }}
        />

        <div className="relative z-10 h-44 w-44 flex-shrink-0">
          <img
            src="/jury/prima.jpg"
            alt="Pak Prima Hartawan"
            className="h-44 w-44 rounded-full border-4 border-gold object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            className="absolute inset-0 hidden items-center justify-center rounded-full border-4 border-gold font-serif text-6xl italic text-cream"
            style={{
              background: 'linear-gradient(135deg, #D4663F 0%, #7A2935 100%)',
            }}
          >
            P
          </div>
        </div>

        <div className="relative z-10">
          <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-coral">
            {eyebrow}
          </div>
          <p className="mb-6 font-serif text-3xl italic leading-snug tracking-tight text-navy">
            {quote}
          </p>
          <div className="mb-1 text-base font-bold text-navy">Pak Prima Hartawan</div>
          <div className="text-sm leading-[1.5] text-warm-gray">
            {locale === 'id'
              ? 'Pendiri Canggu Hospitality Association · Cluster GM, Small Luxury Hotels of the World'
              : 'Founder, Canggu Hospitality Association · Cluster GM, Small Luxury Hotels of the World'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// JURY
// ============================================================================

const JURORS = [
  {
    initial: 'P',
    photo: '/jury/prima.jpg',
    name: 'Pak Prima Hartawan',
    role: 'Founder, CHA',
    bio: 'Cluster GM at Small Luxury Hotels of the World. Founder of the Canggu Hospitality Association. 7+ years in Bali luxury hospitality.',
    color: 'coral',
    linkedin: 'https://www.linkedin.com/in/primahartawanmanguninghotels/',
  },
  {
    initial: 'M',
    photo: '/jury/maya.jpg',
    name: 'Maya Susanti',
    role: 'GM, Lifestyle Residence Uluwatu',
    bio: '12 years across Marriott, Sheraton, Radisson, Soho House & Desa Potato Head. Specialist in scalable hospitality systems.',
    color: 'teal',
    linkedin: 'https://www.linkedin.com/in/maya-susanti-84239611b/',
  },
  {
    initial: 'F',
    photo: '/jury/florian.jpg',
    name: 'Florian Holm',
    role: 'Founder & CEO, Grün Resorts',
    bio: 'Founder of Stilt Studios & Grün Resorts. Ex-Co-CEO Lazada Indonesia, ex-BCG. Building wellness-led hospitality across Bali.',
    color: 'burgundy',
    linkedin: 'https://www.linkedin.com/in/florianholm/',
  },
  {
    initial: 'R',
    photo: '/jury/reto.jpg',
    name: 'Reto Wyss',
    role: 'Co-Founder & CTO, Elev8 Suite OS',
    bio: 'Co-Founder of Elev8 Suite OS — the platform for villa hosts and property managers. Diamond Sponsor of Villa Connect 2026.',
    color: 'gold',
    linkedin: 'https://www.linkedin.com/in/retowyss/',
  },
];

export function Jury() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-28 md:px-8">
      <span className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-coral">
        {t('jury.eyebrow')}
      </span>
      <h2 className="mb-7 font-serif text-display-md leading-[0.98] tracking-[-0.02em] text-navy">
        {t('jury.title.part1')} <span className="italic text-coral">{t('jury.title.peers')}</span>,<br />{t('jury.title.part2')}
      </h2>
      <p className="mb-14 max-w-[720px] text-lg leading-[1.55] text-navy/80">
        {t('jury.lede')}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {JURORS.map((j) => (
          <JuryCard key={j.name} {...j} />
        ))}
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 rounded-3xl border border-line bg-white p-12 md:grid-cols-3">
        <Criterion
          color="coral"
          pct="50%"
          name={t('jury.criteria.story.name')}
          desc={t('jury.criteria.story.desc')}
        />
        <Criterion
          color="teal"
          pct="30%"
          name={t('jury.criteria.growth.name')}
          desc={
            <>
              {t('jury.criteria.growth.desc.before')}{' '}
              <a
                href={elev8Link('criteria')}
                target="_blank"
                rel="noopener"
                className="font-semibold text-teal underline decoration-teal/30 underline-offset-2 hover:decoration-teal"
              >
                Elev8 Suite OS
              </a>{' '}
              {t('jury.criteria.growth.desc.after')}
            </>
          }
        />
        <Criterion
          color="gold"
          pct="20%"
          name={t('jury.criteria.community.name')}
          desc={t('jury.criteria.community.desc')}
        />
      </div>
    </section>
  );
}

function JuryCard({ initial, photo, name, role, bio, color, linkedin }: { initial: string; photo: string | null; name: string; role: string; bio: string; color: string; linkedin?: string }) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    coral: { bg: 'bg-coral', text: 'text-coral', ring: 'ring-coral' },
    teal: { bg: 'bg-teal', text: 'text-teal', ring: 'ring-teal' },
    burgundy: { bg: 'bg-burgundy', text: 'text-burgundy', ring: 'ring-burgundy' },
    gold: { bg: 'bg-gold', text: 'text-gold', ring: 'ring-gold' },
  };
  const c = colors[color];
  const photoColor = color === 'gold' ? 'text-navy' : 'text-white';

  return (
    <div className="rounded-3xl border border-line bg-white p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(31,58,79,0.15)]">
      {photo ? (
        <img
          src={photo}
          alt={name}
          className={`mx-auto mb-4 h-24 w-24 rounded-full object-cover ring-4 ${c.ring}`}
        />
      ) : (
        <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full font-serif text-5xl italic ${c.bg} ${photoColor}`}>
          {initial}
        </div>
      )}
      <h3 className="mb-1.5 font-serif text-xl leading-tight tracking-tight text-navy">{name}</h3>
      <div className={`mb-3.5 text-[11px] font-bold uppercase tracking-wider ${c.text}`}>{role}</div>
      <p className="mb-4 text-[13px] leading-[1.5] text-warm-gray">{bio}</p>
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener"
          aria-label={`${name} on LinkedIn`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2] text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      )}
    </div>
  );
}

function Criterion({ color, pct, name, desc }: { color: string; pct: string; name: string; desc: React.ReactNode }) {
  const colors: Record<string, { bar: string; text: string }> = {
    coral: { bar: 'bg-coral', text: 'text-coral' },
    teal: { bar: 'bg-teal', text: 'text-teal' },
    gold: { bar: 'bg-gold', text: 'text-gold' },
  };
  const c = colors[color];

  return (
    <div className="relative pl-5">
      <div className={`absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded ${c.bar}`} />
      <div className={`mb-1.5 font-serif text-[56px] leading-none tracking-tight ${c.text}`}>{pct}</div>
      <div className="mb-2 font-serif text-2xl italic text-navy">{name}</div>
      <p className="text-sm leading-[1.5] text-warm-gray">{desc}</p>
    </div>
  );
}

// ============================================================================
// FINAL CTA
// ============================================================================

export function FinalCTA() {
  const { t } = useLang();
  return (
    <div className="mx-auto my-20 max-w-[1280px] px-4 md:px-8">
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-24 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #D4663F 0%, #7A2935 100%)' }}
      >
        <div
          className="pointer-events-none absolute -right-36 -top-36 h-[400px] w-[400px]"
          style={{ background: 'radial-gradient(circle, rgba(232, 169, 60, 0.25) 0%, transparent 70%)' }}
        />
        <h2 className="relative z-10 mb-7 font-serif text-display-md leading-[0.98] tracking-tight">
          Ready to make<br />your <span className="italic text-gold">case</span>?
        </h2>
        <p className="relative z-10 mx-auto mb-11 max-w-[600px] text-lg leading-[1.55] text-white/90">
          Three minutes for Quick Apply. Twelve for the full story. Either way, you're in.
        </p>
        <Link
          href="/apply"
          className="relative z-10 inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-[18px] text-[15px] font-bold text-burgundy transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-navy"
        >
          {t('hero.cta_apply')}
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-navy-dark px-4 py-20 text-cream md:px-8">
      <div className="mx-auto mb-12 grid max-w-[1280px] grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3.5">
            <CHALogo size={60} />
            <div>
              <div className="font-serif text-xl leading-none text-cream">CANGGU</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                Hospitality Association
              </div>
            </div>
          </div>
          <p className="mb-5 max-w-[340px] text-sm leading-[1.55] text-cream/55">
            {t('footer.tagline')}
          </p>
          <a
            href={elev8Link('footer-badge')}
            target="_blank"
            rel="noopener"
            className="inline-block rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-navy transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            ⬥ Powered by Elev8 Suite OS — Diamond Sponsor
          </a>
        </div>
        <FooterCol
          heading={t('footer.col.awards')}
          items={[
            [t('footer.link.categories'), '#prize'],
            [t('footer.link.apply'), '/apply'],
          ]}
        />
        <FooterCol
          heading={t('footer.col.connect')}
          items={[['WhatsApp', '#'], ['LinkedIn', '#'], ['Instagram', '#']]}
        />
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-3 border-t border-cream/10 pt-7 text-xs text-cream/50 md:flex-row">
        <span>{t('footer.copyright')}</span>
        <span>
          {t('footer.edition')}{' '}
          <a
            href={elev8Link('footer-copyright')}
            target="_blank"
            rel="noopener"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            Elev8 Suite OS
          </a>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, items }: { heading: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">{heading}</h4>
      {items.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className="block py-1.5 text-sm text-cream/70 transition-colors hover:text-gold"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
