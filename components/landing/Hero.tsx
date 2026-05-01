'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { useLang } from '@/components/common/LangProvider';
import { LiveCount } from '@/components/common/LiveCount';
import { elev8Link } from '@/lib/utils';

export function Hero() {
  const { t } = useLang();

  return (
    <section
      className="relative overflow-hidden px-4 pb-20 pt-32 md:px-8 md:pb-24 md:pt-36"
      style={{
        background:
          'radial-gradient(circle at 90% -10%, rgba(232, 169, 60, 0.18) 0%, transparent 45%), radial-gradient(circle at -5% 100%, rgba(31, 138, 122, 0.14) 0%, transparent 50%), #F8F2E8',
      }}
    >
      {/* Decorative CHA logo */}
      <div className="pointer-events-none absolute -right-20 top-24 hidden -rotate-12 opacity-[0.18] md:block">
        <CHALogo size={420} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px]">
        <div className="mb-9 inline-flex items-center gap-3 rounded-full bg-navy px-4 py-2 text-xs font-semibold tracking-wide text-cream">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
          {t('hero.eyebrow')}
        </div>

        <h1 className="mb-9 max-w-[1100px] font-serif text-[clamp(54px,10vw,140px)] leading-[0.95] tracking-[-0.02em] text-navy">
          {t('hero.title.line1')}
          <br />
          {t('hero.title.line2')}{' '}
          <span className="italic text-coral">{t('hero.title.awards')}</span>
        </h1>

        <div className="mb-9 inline-flex flex-wrap items-center gap-4 rounded-full bg-white px-5 py-3 text-sm text-navy shadow-[0_1px_0_var(--color-line)]">
          <CHALogo size={32} />
          <span>
            <strong className="font-bold">{t('hero.presented_by')}</strong> Canggu Hospitality
            Association
          </span>
          <span className="text-warm-gray opacity-40">·</span>
          <span>
            {t('hero.powered_by')}{' '}
            <a
              href={elev8Link('hero')}
              target="_blank"
              rel="noopener"
              className="font-bold underline decoration-gold/0 underline-offset-4 transition-all hover:decoration-gold"
            >
              Elev8 Suite OS
            </a>
          </span>
        </div>

        <p className="mb-12 max-w-[720px] text-[clamp(18px,2.2vw,23px)] leading-[1.5] text-navy/85">
          {t('hero.lede')}
        </p>

        <div className="mb-16 flex flex-wrap items-center gap-3.5">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2.5 rounded-full bg-coral px-9 py-[18px] text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-burgundy hover:shadow-[0_12px_30px_-10px_rgba(122,41,53,0.4)]"
          >
            {t('hero.cta_apply')}
          </Link>
          <a
            href="#prize"
            className="inline-flex items-center rounded-full border-[1.5px] border-navy bg-transparent px-7 py-[18px] text-[15px] font-semibold text-navy transition-all hover:bg-navy hover:text-cream"
          >
            {t('hero.cta_prize')}
          </a>
        </div>

        <div className="grid max-w-[920px] grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard color="coral" label={t('hero.stat.applications')}>
            <LiveCount label="" />
          </StatCard>
          <StatCard color="teal" label={t('hero.stat.winners')}>
            3
          </StatCard>
          <StatCard color="burgundy" label={t('hero.stat.finalists')}>
            5
          </StatCard>
          <StatCard color="gold" label={t('hero.stat.deadline')} small>
            <CountdownDisplay />
          </StatCard>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  color,
  label,
  children,
  small,
}: {
  color: 'coral' | 'teal' | 'burgundy' | 'gold';
  label: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  const borderClass = {
    coral: 'border-t-coral',
    teal: 'border-t-teal',
    burgundy: 'border-t-burgundy',
    gold: 'border-t-gold',
  }[color];

  return (
    <div
      className={`rounded-2xl border-t-4 bg-white p-6 transition-transform hover:-translate-y-0.5 ${borderClass}`}
    >
      <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-warm-gray">
        {label}
      </div>
      <div
        className={`flex items-baseline gap-2 font-serif font-normal leading-none tracking-tight text-navy ${
          small ? 'text-2xl' : 'text-[38px]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// CountdownDisplay — live-updating time until deadline
// ============================================================================

const DEADLINE = process.env.NEXT_PUBLIC_APPLICATIONS_CLOSE_AT || '2026-05-22T23:59:59+08:00';

function CountdownDisplay() {
  const { locale } = useLang();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000 * 60); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  if (now === null) {
    // SSR/initial render — show static fallback
    return <span className="text-2xl">22 May</span>;
  }

  const target = new Date(DEADLINE).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return <span className="text-2xl text-coral">Closed</span>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  // Different layouts based on time remaining
  if (days > 1) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-navy">{days}</span>
        <span className="text-xs text-warm-gray">{locale === 'id' ? 'hari' : 'days'}</span>
        <span className="ml-1.5 text-2xl font-bold text-navy">{hours}</span>
        <span className="text-xs text-warm-gray">{locale === 'id' ? 'jam' : 'h'}</span>
      </div>
    );
  }

  if (days === 1) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-coral">{days}</span>
        <span className="text-xs text-coral">{locale === 'id' ? 'hari' : 'day'}</span>
        <span className="ml-1.5 text-2xl font-bold text-coral">{hours}</span>
        <span className="text-xs text-coral">{locale === 'id' ? 'jam' : 'h'}</span>
      </div>
    );
  }

  // Last day
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-burgundy">{hours}</span>
      <span className="text-xs text-burgundy">h</span>
      <span className="ml-1.5 text-2xl font-bold text-burgundy">{minutes}</span>
      <span className="text-xs text-burgundy">m</span>
    </div>
  );
}
