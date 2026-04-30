'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { LangProvider, LangToggle, useLang } from '@/components/common/LangProvider';
import {
  generateWhatsAppShareUrl,
  generateLinkedInShareUrl,
} from '@/lib/utils';

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <LangProvider>
        <ThankYouInner />
      </LangProvider>
    </Suspense>
  );
}

function ThankYouInner() {
  const { t, locale } = useLang();
  const params = useSearchParams();
  const slug = params.get('slug');
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (slug) setPageUrl(`${window.location.origin}/v/${slug}`);
  }, [slug]);

  const shareText =
    locale === 'id'
      ? `Saya baru saja mendaftar di CHA Hospitality Awards 2026 🏆\n\nBerikan suara Anda di:\n${pageUrl}`
      : `I just applied to the CHA Hospitality Awards 2026 🏆\n\nCast your vote here:\n${pageUrl}`;

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={32} />
            <span className="text-xs font-extrabold tracking-wider text-navy">CHA AWARDS</span>
          </Link>
          <LangToggle />
        </div>
      </header>

      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-7 inline-flex h-20 w-20 items-center justify-center rounded-full bg-coral/10 text-4xl">
            🏆
          </div>

          <h1 className="mb-5 font-serif text-[clamp(36px,6vw,56px)] leading-tight tracking-tight text-navy">
            {locale === 'id' ? 'Anda sudah masuk' : "You're in"}.
          </h1>

          <p className="mb-12 text-lg leading-relaxed text-navy/80">
            {locale === 'id'
              ? 'Pendaftaran Anda diterima. Konfirmasi sudah kami kirim via email dan WhatsApp.'
              : 'Your application is in. We\'ve sent confirmation via email and WhatsApp.'}
          </p>

          {pageUrl && (
            <div className="mb-12 rounded-3xl border border-line bg-white p-7 text-left">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-coral">
                {locale === 'id' ? 'Halaman publik Anda' : 'Your public page'}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-navy/75">
                {locale === 'id'
                  ? 'Bagikan halaman ini dengan jaringan Anda. Setiap suara membantu Anda maju ke panggung di Villa Connect 2026.'
                  : 'Share this page with your network. Every vote helps you get on the Villa Connect 2026 stage.'}
              </p>

              <div className="mb-5 break-all rounded-xl bg-cream p-3 font-mono text-xs text-navy">
                {pageUrl}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <a
                  href={generateWhatsAppShareUrl(shareText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={generateLinkedInShareUrl(pageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0077B5] px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  in LinkedIn
                </a>
                <Link
                  href={`/v/${slug}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-cream transition-transform hover:-translate-y-0.5"
                >
                  {locale === 'id' ? '👁️ Lihat halaman' : '👁️ View page'}
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-4 text-left">
            <NextStep
              num="01"
              title={locale === 'id' ? 'Cek email Anda' : 'Check your email'}
              desc={
                locale === 'id'
                  ? 'Konfirmasi dengan link halaman publik sudah kami kirim.'
                  : 'Confirmation with your public page link has been sent.'
              }
            />
            <NextStep
              num="02"
              title={locale === 'id' ? 'Bagikan halaman Anda' : 'Share your page'}
              desc={
                locale === 'id'
                  ? 'Hubungi jaringan Anda. Vote ditutup 22 Mei 23:59 WITA.'
                  : 'Reach out to your network. Voting closes 22 May 23:59 WITA.'
              }
            />
            <NextStep
              num="03"
              title={locale === 'id' ? 'Pengumuman 25 Mei' : '25 May reveal'}
              desc={
                locale === 'id'
                  ? '5 finalis diumumkan. Jika Anda terpilih, Anda dapat tiket gratis Villa Connect.'
                  : 'Top 5 finalists revealed. If you make it, you get a free Villa Connect ticket.'
              }
            />
          </div>

          <Link
            href="/"
            className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-coral hover:text-burgundy"
          >
            ← {locale === 'id' ? 'Kembali ke beranda' : 'Back to home'}
          </Link>
        </div>
      </section>
    </main>
  );
}

function NextStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral/10 font-mono text-xs font-bold text-coral">
        {num}
      </div>
      <div>
        <div className="mb-0.5 font-serif text-lg leading-tight text-navy">{title}</div>
        <div className="text-sm text-warm-gray">{desc}</div>
      </div>
    </div>
  );
}
