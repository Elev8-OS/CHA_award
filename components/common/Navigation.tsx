'use client';

import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { LangToggle, useLang } from '@/components/common/LangProvider';
import { LiveCount } from '@/components/common/LiveCount';

export function Navigation() {
  const { t } = useLang();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur-xl md:px-8">
      <Link href="/" className="flex items-center gap-3.5">
        <CHALogo size={40} />
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-extrabold tracking-wider text-navy">CANGGU</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-warm-gray">
            Hospitality Association
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-xs font-medium text-warm-gray md:flex">
          <LiveCount label={t('nav.applications')} />
          <span>{t('nav.applications')}</span>
        </span>
        <LangToggle />
        <Link
          href="/apply"
          className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-px hover:bg-burgundy"
        >
          {t('nav.apply')}
        </Link>
      </div>
    </nav>
  );
}
