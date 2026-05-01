'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHALogo } from '@/components/common/CHALogo';
import { LangProvider, LangToggle, useLang } from '@/components/common/LangProvider';
import Link from 'next/link';

export default function ApplyPage() {
  return (
    <LangProvider>
      <ApplyChooser />
    </LangProvider>
  );
}

function ApplyChooser() {
  const { t, locale } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState<'quick' | 'deep' | null>(null);

  const start = async (mode: 'quick' | 'deep') => {
    setLoading(mode);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, language: locale, source: 'apply_landing' }),
      });
      const data = await res.json();
      if (data.continue_token) {
        router.push(`/apply/${data.continue_token}`);
      } else {
        alert(t('common.error'));
        setLoading(null);
      }
    } catch {
      alert(t('common.error'));
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={48} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-extrabold tracking-wider text-navy">CANGGU</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
                Hospitality Association
              </span>
            </div>
          </Link>
          <LangToggle />
        </div>
      </header>

      <section className="px-5 pt-10 pb-20 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-coral">
            {t('apply.section_eyebrow')}
          </div>
          <h1 className="mb-7 font-serif text-[clamp(40px,7vw,72px)] leading-[0.98] tracking-tight text-navy">
            {t('apply.title.line1')} {t('apply.title.line2')}{' '}
            <span className="italic text-coral">{t('apply.title.apply')}</span>.
          </h1>
          <p className="mb-12 max-w-[640px] text-lg leading-relaxed text-navy/80">
            {t('apply.lede')}
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Quick Apply */}
            <button
              onClick={() => start('quick')}
              disabled={loading !== null}
              className="group relative overflow-hidden rounded-3xl border border-line bg-white p-8 text-left transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(31,58,79,0.15)] disabled:opacity-50"
            >
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-warm-gray">
                ⬥ {t('apply.quick.tag')}
              </div>
              <h2 className="mb-1.5 font-serif text-3xl leading-tight text-navy">
                {t('apply.quick.name')}
              </h2>
              <div className="mb-4 text-sm font-semibold text-warm-gray">{t('apply.quick.time')}</div>
              <p className="mb-7 text-sm leading-relaxed text-navy/75">{t('apply.quick.desc')}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-coral group-hover:gap-3 transition-all">
                {loading === 'quick' ? t('common.loading') : <>{t('hero.cta_apply')}</>}
              </div>
            </button>

            {/* Deep Story (highlighted) */}
            <button
              onClick={() => start('deep')}
              disabled={loading !== null}
              className="group relative overflow-hidden rounded-3xl bg-coral p-8 text-left text-white transition-all hover:-translate-y-1 hover:bg-burgundy hover:shadow-[0_24px_50px_-20px_rgba(122,41,53,0.4)] disabled:opacity-50"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(232, 169, 60, 0.5) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                  ⬥ {t('apply.deep.tag')} · {locale === 'id' ? 'Disarankan' : 'Recommended'}
                </div>
                <h2 className="mb-1.5 font-serif text-3xl leading-tight">{t('apply.deep.name')}</h2>
                <div className="mb-4 text-sm font-semibold text-white/75">{t('apply.deep.time')}</div>
                <p className="mb-7 text-sm leading-relaxed text-white/90">{t('apply.deep.desc')}</p>
                <div className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all">
                  {loading === 'deep' ? t('common.loading') : <>{t('hero.cta_apply')}</>}
                </div>
              </div>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-warm-gray">
            {locale === 'id'
              ? 'Anda bisa menyimpan dan melanjutkan kapan saja sebelum 22 Mei.'
              : 'You can save and continue anytime before 22 May.'}
          </p>
        </div>
      </section>
    </main>
  );
}
