'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { LangProvider, LangToggle, useLang } from '@/components/common/LangProvider';
import { CountdownBanner } from '@/components/common/CountdownBanner';
import { categoryColors, getInitials, generateWhatsAppShareUrl, generateLinkedInShareUrl, elev8Link } from '@/lib/utils';
import { AnimatedVoteCount } from '@/components/vote/LiveVoteCount';

interface Applicant {
  id: string;
  public_slug: string;
  full_name: string | null;
  business_name: string | null;
  category: 'boutique' | 'growing' | 'scaled' | null;
  location: string | null;
  villa_count: number | null;
  years_hosting: number | null;
  hero_photo_url: string | null;
  logo_url: string | null;
  short_pitch: string | null;
  share_voice_message_url: string | null;
  biggest_headache: string | null;
  first_attack: string | null;
  twelve_month_vision: string | null;
  why_you: string | null;
  willing_for_case_study: boolean;
  view_count: number;
  share_count: number;
  vote_count: number;
  category_rank: number;
}

export function ApplicantPageClient({ applicant }: { applicant: Applicant }) {
  return (
    <LangProvider>
      <ApplicantPageInner applicant={applicant} />
    </LangProvider>
  );
}

function ApplicantPageInner({ applicant }: { applicant: Applicant }) {
  const { t, locale } = useLang();
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteCount, setVoteCount] = useState(applicant.vote_count);
  const [shareCount, setShareCount] = useState(applicant.share_count);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl(window.location.href);

    // Check if already voted (localStorage)
    const votedFor = localStorage.getItem(`voted-${applicant.id}`);
    if (votedFor === 'true') setHasVoted(true);
  }, [applicant.id]);

  const cat = applicant.category || 'boutique';
  const colors = categoryColors[cat];
  const displayName = applicant.full_name || applicant.business_name || 'Applicant';
  const initials = getInitials(displayName);

  // Read referrer slug from URL ?ref=... and persist for the vote
  const [referrerSlug, setReferrerSlug] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref !== applicant.public_slug) {
      setReferrerSlug(ref);
      // Persist so the credit holds even if they navigate within the page
      try {
        sessionStorage.setItem(`ref-${applicant.id}`, ref);
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem(`ref-${applicant.id}`);
        if (stored) setReferrerSlug(stored);
      } catch {}
    }
  }, [applicant.id, applicant.public_slug]);

  // Share URL — appends ?ref=THIS_APPLICANT so we can attribute conversions
  const shareUrl = pageUrl ? `${pageUrl}?ref=${applicant.public_slug}` : '';

  const shareText =
    locale === 'id'
      ? `Saya mendukung ${applicant.business_name} di CHA Hospitality Awards 2026 🏆\n\nBerikan suara Anda di:\n${shareUrl}`
      : `I'm supporting ${applicant.business_name} in the CHA Hospitality Awards 2026 🏆\n\nCast your vote here:\n${shareUrl}`;

  return (
    <>
      {/* ===== Sticky Header ===== */}
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={44} />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-wider text-navy">CHA AWARDS</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
                Edition 01 · 2026
              </span>
            </div>
          </Link>
          <LangToggle />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="px-5 pt-8 pb-10">
        <div className="mx-auto max-w-2xl">
          {/* Category Badge */}
          <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${colors.light} ${colors.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.bg}`} />
            {cat === 'boutique' && '⬥ Boutique · 1 — 3 villas'}
            {cat === 'growing' && '⬥ Growing · 4 — 9 villas'}
            {cat === 'scaled' && '⬥ Scaled · 10+ villas'}
          </div>

          {/* Photo + Name */}
          <div className="mb-6 flex items-center gap-5">
            {applicant.hero_photo_url ? (
              <img
                src={applicant.hero_photo_url}
                alt={displayName}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-white font-serif text-4xl italic text-white shadow-lg ${colors.bg}`}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {applicant.business_name && (
                <h1 className="font-serif text-3xl leading-tight tracking-tight text-navy md:text-4xl">
                  {applicant.business_name}
                </h1>
              )}
              {applicant.full_name && (
                <div className="mt-1 text-sm font-semibold text-navy/70">{applicant.full_name}</div>
              )}
              {applicant.location && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-warm-gray">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.5-12a.5.5 0 00-1 0v4.5H6a.5.5 0 000 1h4a.5.5 0 00.5-.5V6z" clipRule="evenodd" />
                  </svg>
                  {applicant.location}
                </div>
              )}
            </div>
          </div>

          {/* Short pitch */}
          {applicant.short_pitch && (
            <p className="mb-6 font-serif text-xl italic leading-snug text-navy/85">
              "{applicant.short_pitch}"
            </p>
          )}

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatPill value={applicant.villa_count?.toString() || '—'} label={cat === 'boutique' || cat === 'growing' ? 'villas' : 'villas'} />
            <StatPill value={applicant.years_hosting?.toString() || '—'} label="years" />
            <StatPill value={`#${applicant.category_rank}`} label="in category" />
          </div>
        </div>
      </section>

      {/* ===== Voting Block (sticky-ish prominent) ===== */}
      <section className="px-5 pb-10">
        <div className="mx-auto max-w-2xl">
          <div
            className="relative overflow-hidden rounded-3xl p-7 text-white shadow-xl"
            style={{
              background:
                cat === 'boutique'
                  ? 'linear-gradient(135deg, #D4663F 0%, #B5532F 100%)'
                  : cat === 'growing'
                  ? 'linear-gradient(135deg, #1F8A7A 0%, #176F62 100%)'
                  : 'linear-gradient(135deg, #7A2935 0%, #5C1F28 100%)',
            }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                Community Votes
              </div>
              <div className="mb-1 font-serif text-6xl leading-none tracking-tight">
                <AnimatedVoteCount applicationId={applicant.id} initialCount={voteCount} />
              </div>
              <div className="mb-5 text-sm text-white/80">
                {locale === 'id' ? 'orang sudah memilih' : 'people have voted'}
              </div>

              {!hasVoted ? (
                <button
                  onClick={() => setShowVoteModal(true)}
                  className="w-full rounded-2xl bg-white px-6 py-4 text-base font-bold text-navy transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t('vote.cast_vote')} →
                </button>
              ) : (
                <div className="rounded-2xl bg-white/20 px-6 py-4 text-center text-base font-semibold backdrop-blur">
                  ✓ {t('vote.you_voted')}
                </div>
              )}

              <div className="mt-4 text-center text-xs text-white/70">
                {t('vote.deadline')} — 22 May 23:59 WITA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Share Block ===== */}
      <section className="px-5 pb-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-navy">
                {locale === 'id' ? 'Bantu mereka menang' : 'Help them win'}
              </h2>
              <span className="text-xs text-warm-gray">
                {shareCount > 0 && `${shareCount} ${locale === 'id' ? 'kali dibagikan' : 'shares'}`}
              </span>
            </div>

            {/* Voice plea — if recorded */}
            {applicant.share_voice_message_url && (
              <div className="mb-5 rounded-2xl border-l-4 border-coral bg-coral/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-coral">
                  <span>🎙️</span>
                  <span>
                    {locale === 'id'
                      ? `Pesan dari ${applicant.full_name || applicant.business_name}`
                      : `A message from ${applicant.full_name || applicant.business_name}`}
                  </span>
                </div>
                <audio
                  src={applicant.share_voice_message_url}
                  controls
                  preload="metadata"
                  className="w-full"
                  style={{ height: '38px' }}
                />
              </div>
            )}

            <p className="mb-5 text-sm leading-relaxed text-navy/75">
              {locale === 'id'
                ? 'Bagikan halaman ini dengan jaringan Anda. Setiap suara membantu mereka maju ke panggung di Villa Connect 2026.'
                : 'Share this page with your network. Every vote helps them get on the Villa Connect 2026 stage.'}
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <ShareButton
                href={generateWhatsAppShareUrl(shareText)}
                onClick={() => trackShare(applicant.id, 'whatsapp')}
                color="bg-[#25D366] text-white"
                icon="💬"
                label="WhatsApp"
              />
              <ShareButton
                href={generateLinkedInShareUrl(shareUrl)}
                onClick={() => trackShare(applicant.id, 'linkedin')}
                color="bg-[#0077B5] text-white"
                icon="in"
                label="LinkedIn"
              />
              <CopyLinkButton
                url={shareUrl}
                onClick={() => trackShare(applicant.id, 'copy')}
                label={t('vote.copy_link')}
                copiedLabel={t('vote.link_copied')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Their Story ===== */}
      {(applicant.biggest_headache || applicant.first_attack || applicant.why_you) && (
        <section className="px-5 pb-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 font-serif text-3xl text-navy">{t('vote.story_title')}</h2>

            <div className="space-y-4">
              {applicant.biggest_headache && (
                <StoryCard
                  color="coral"
                  label={t('vote.headache_label')}
                  text={applicant.biggest_headache}
                />
              )}
              {applicant.first_attack && (
                <StoryCard
                  color="teal"
                  label={t('vote.attack_label')}
                  text={applicant.first_attack}
                />
              )}
              {applicant.twelve_month_vision && (
                <StoryCard
                  color="burgundy"
                  label={t('vote.vision_label')}
                  text={applicant.twelve_month_vision}
                />
              )}
              {applicant.why_you && (
                <StoryCard
                  color="gold"
                  label={locale === 'id' ? 'Mengapa mereka' : 'Why they should win'}
                  text={applicant.why_you}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== About the Awards ===== */}
      <section className="px-5 pb-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-7">
          <div className="mb-3 flex items-center gap-3">
            <CHALogo size={48} />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral">
                {t('vote.about_awards')}
              </div>
              <h3 className="font-serif text-xl text-navy">The CHA Hospitality Awards 2026</h3>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-navy/75">
            {locale === 'id' ? (
              <>
                Award tahunan yang menyoroti operator villa terbaik di Canggu. Diselenggarakan oleh Canggu Hospitality Association, didukung oleh{' '}
                <a
                  href={elev8Link('applicant-page-about')}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-navy underline decoration-coral/30 underline-offset-2 hover:decoration-coral"
                >
                  Elev8 Suite OS
                </a>{' '}
                sebagai Diamond Sponsor di Bali Villa Connect 2026.
              </>
            ) : (
              <>
                An annual award celebrating the top villa operators in Canggu. Presented by the Canggu Hospitality Association, powered by{' '}
                <a
                  href={elev8Link('applicant-page-about')}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-navy underline decoration-coral/30 underline-offset-2 hover:decoration-coral"
                >
                  Elev8 Suite OS
                </a>{' '}
                as Diamond Sponsor of Bali Villa Connect 2026.
              </>
            )}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-coral hover:text-burgundy"
          >
            {locale === 'id' ? 'Pelajari lebih lanjut' : 'Learn more'} →
          </Link>
        </div>
      </section>

      {/* ===== Other Applicants ===== */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/finalists"
            className="block rounded-2xl bg-navy p-6 text-center text-cream transition-transform hover:-translate-y-0.5"
          >
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
              {t('vote.discover_others')}
            </div>
            <div className="font-serif text-2xl">
              {locale === 'id' ? 'Lihat semua pendaftar' : 'See all applicants'} →
            </div>
          </Link>
        </div>
      </section>

      {/* ===== Vote Modal ===== */}
      {showVoteModal && (
        <VoteModal
          applicant={applicant}
          referrerSlug={referrerSlug}
          onClose={() => setShowVoteModal(false)}
          onSuccess={() => {
            setHasVoted(true);
            setVoteCount((c) => c + 1);
            setShowVoteModal(false);
            localStorage.setItem(`voted-${applicant.id}`, 'true');
          }}
        />
      )}

      <CountdownBanner />
    </>
  );
}

// ---------- Sub-components ----------

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div className="font-serif text-2xl leading-tight text-navy">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
        {label}
      </div>
    </div>
  );
}

function ShareButton({
  href,
  onClick,
  color,
  icon,
  label,
}: {
  href: string;
  onClick: () => void;
  color: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${color}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function CopyLinkButton({
  url,
  onClick,
  label,
  copiedLabel,
}: {
  url: string;
  onClick: () => void;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 rounded-2xl bg-navy px-5 py-3.5 text-sm font-bold text-cream transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function StoryCard({
  color,
  label,
  text,
}: {
  color: 'coral' | 'teal' | 'burgundy' | 'gold';
  label: string;
  text: string;
}) {
  const styles = {
    coral: { border: 'border-l-coral', text: 'text-coral' },
    teal: { border: 'border-l-teal', text: 'text-teal' },
    burgundy: { border: 'border-l-burgundy', text: 'text-burgundy' },
    gold: { border: 'border-l-gold', text: 'text-gold' },
  }[color];

  return (
    <div className={`rounded-2xl border-l-4 bg-white p-5 ${styles.border}`}>
      <div className={`mb-2 text-[11px] font-bold uppercase tracking-[0.14em] ${styles.text}`}>
        {label}
      </div>
      <p className="text-base leading-relaxed text-navy">{text}</p>
    </div>
  );
}

// ---------- Vote Modal with WhatsApp OTP ----------

function VoteModal({
  applicant,
  referrerSlug,
  onClose,
  onSuccess,
}: {
  applicant: Applicant;
  referrerSlug: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, locale } = useLang();
  const [step, setStep] = useState<'phone' | 'otp' | 'submitting'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/votes/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicant.id,
          voter_whatsapp: phone,
          voter_name: name,
          referrer_slug: referrerSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/votes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicant.id,
          voter_whatsapp: phone,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-coral">
              {t('vote.title')}
            </div>
            <h3 className="font-serif text-2xl text-navy">{applicant.business_name}</h3>
          </div>
          <button onClick={onClose} className="text-2xl text-warm-gray hover:text-navy">
            ×
          </button>
        </div>

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">
                {locale === 'id' ? 'Nama Anda (opsional)' : 'Your name (optional)'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === 'id' ? 'Cth. Hendra' : 'e.g. Hendra'}
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-sm focus:border-coral focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">
                {locale === 'id' ? 'Nomor WhatsApp' : 'WhatsApp number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812..."
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-sm focus:border-coral focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-warm-gray">
                {locale === 'id'
                  ? 'Kami akan mengirim kode konfirmasi 6 digit via WhatsApp untuk mencegah voting palsu.'
                  : "We'll send you a 6-digit code via WhatsApp to prevent fake voting."}
              </p>
            </div>
            {error && (
              <div className="rounded-lg bg-burgundy/10 p-3 text-sm text-burgundy">{error}</div>
            )}
            <button
              onClick={requestOtp}
              disabled={!phone || loading}
              className="w-full rounded-xl bg-coral px-6 py-4 text-base font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
            >
              {loading
                ? t('common.loading')
                : locale === 'id'
                ? 'Kirim kode →'
                : 'Send code →'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-navy">
              {locale === 'id'
                ? `Kode dikirim ke ${phone}. Masukkan 6 digit yang Anda terima.`
                : `Code sent to ${phone}. Enter the 6 digits you received.`}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-4 text-center font-mono text-2xl tracking-widest focus:border-coral focus:outline-none"
            />
            {error && (
              <div className="rounded-lg bg-burgundy/10 p-3 text-sm text-burgundy">{error}</div>
            )}
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full rounded-xl bg-coral px-6 py-4 text-base font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('vote.cast_vote')}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-sm text-warm-gray hover:text-navy"
            >
              {t('form.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Tracking ----------

async function trackShare(applicationId: string, channel: string) {
  try {
    await fetch('/api/track/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId, channel }),
    });
  } catch {
    // silent
  }
}
