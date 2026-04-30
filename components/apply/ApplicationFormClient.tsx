'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { LangProvider, LangToggle, useLang } from '@/components/common/LangProvider';
import { PhotoUpload } from '@/components/apply/PhotoUpload';
import { VoiceRecorder } from '@/components/apply/VoiceRecorder';
import type { Locale } from '@/lib/i18n/translations';

interface Application {
  id: string;
  continue_token: string;
  mode: 'quick' | 'deep';
  status: string;
  language: 'en' | 'id';
  full_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  attending_villa_connect?: 'yes' | 'no' | 'maybe' | null;
  villa_count?: number | null;
  years_hosting?: number | null;
  team_size?: number | null;
  occupancy_pct?: number | null;
  channels?: string[] | null;
  current_tools?: string | null;
  current_tools_pros?: string | null;
  current_tools_cons?: string | null;
  biggest_headache?: string | null;
  first_attack?: string | null;
  twelve_month_vision?: string | null;
  why_you?: string | null;
  short_pitch?: string | null;
  hero_photo_url?: string | null;
  share_voice_message_url?: string | null;
  willing_for_case_study?: boolean;
  consent_to_publish_name?: boolean;
}

export function ApplicationFormClient({ initialApplication }: { initialApplication: Application }) {
  return (
    <LangProvider initialLocale={initialApplication.language as Locale}>
      <FormShell app={initialApplication} />
    </LangProvider>
  );
}

function FormShell({ app: initialApp }: { app: Application }) {
  const router = useRouter();
  const { t, locale } = useLang();
  const [app, setApp] = useState<Application>(initialApp);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = app.mode === 'deep' ? 5 : 3;

  // Auto-save with debounce
  const saveDraft = useCallback(
    async (updates: Partial<Application>) => {
      setSaving(true);
      try {
        await fetch('/api/applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            continue_token: initialApp.continue_token,
            language: locale,
            ...updates,
          }),
        });
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    },
    [initialApp.continue_token, locale]
  );

  // Sync language change to backend
  useEffect(() => {
    if (locale !== app.language) {
      saveDraft({ language: locale });
      setApp((s) => ({ ...s, language: locale }));
    }
  }, [locale, app.language, saveDraft]);

  const updateField = (field: keyof Application, value: any) => {
    setApp((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  // Save before moving to next step
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredMsg = locale === 'id' ? 'Wajib diisi' : 'Required';

    if (currentStep === 1) {
      if (!app.full_name) newErrors.full_name = requiredMsg;
      if (!app.business_name) newErrors.business_name = requiredMsg;
      if (!app.email) newErrors.email = requiredMsg;
      if (!app.whatsapp) newErrors.whatsapp = requiredMsg;
      if (!app.location) newErrors.location = requiredMsg;
    }
    if (currentStep === 2) {
      if (!app.villa_count || app.villa_count < 1) newErrors.villa_count = requiredMsg;
      if (!app.channels || app.channels.length === 0)
        newErrors.channels = locale === 'id' ? 'Pilih minimal satu' : 'Select at least one';
    }
    if (currentStep === 3 && app.mode === 'deep') {
      if (!app.current_tools) newErrors.current_tools = requiredMsg;
    }
    if (currentStep === 4 && app.mode === 'deep') {
      if (!app.biggest_headache || app.biggest_headache.length < 20)
        newErrors.biggest_headache = locale === 'id' ? 'Min 20 karakter' : 'Min 20 chars';
      if (!app.first_attack || app.first_attack.length < 20)
        newErrors.first_attack = locale === 'id' ? 'Min 20 karakter' : 'Min 20 chars';
      if (!app.why_you || app.why_you.length < 50)
        newErrors.why_you = locale === 'id' ? 'Min 50 karakter' : 'Min 50 chars';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep(step)) return;
    await saveDraft(extractUpdates(app));
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      // Save final state
      await saveDraft(extractUpdates(app));
      // Submit
      const res = await fetch(`/api/applications/${app.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continue_token: app.continue_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      router.push(`/apply/thank-you?slug=${data.public_slug}`);
    } catch (e: any) {
      alert(e.message || t('common.error'));
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CHALogo size={32} />
            <span className="text-xs font-extrabold tracking-wider text-navy">CHA AWARDS</span>
          </Link>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-[11px] font-medium text-warm-gray">
                {locale === 'id' ? 'Menyimpan...' : 'Saving...'}
              </span>
            )}
            <LangToggle />
          </div>
        </div>
      </header>

      <section className="px-5 py-10 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
          <div className="mb-7">
            <div className="mb-3 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-warm-gray">
              <span>
                {t('form.step')} {step} {t('form.of')} {totalSteps}
              </span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded transition-all ${
                    i + 1 < step
                      ? 'bg-coral'
                      : i + 1 === step
                      ? 'bg-navy'
                      : 'bg-line'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="rounded-3xl border border-line bg-white p-7 md:p-10">
            {step === 1 && <Step1 app={app} update={updateField} errors={errors} locale={locale} />}
            {step === 2 && <Step2 app={app} update={updateField} errors={errors} locale={locale} />}
            {step === 3 && app.mode === 'quick' && (
              <Step3Quick app={app} update={updateField} errors={errors} locale={locale} />
            )}
            {step === 3 && app.mode === 'deep' && (
              <Step3Deep app={app} update={updateField} errors={errors} locale={locale} />
            )}
            {step === 4 && app.mode === 'deep' && (
              <Step4Deep app={app} update={updateField} errors={errors} locale={locale} />
            )}
            {step === 5 && app.mode === 'deep' && (
              <Step5Deep app={app} update={updateField} errors={errors} locale={locale} />
            )}
          </div>

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="rounded-full border border-line bg-transparent px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
              >
                {t('form.back')}
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="rounded-full bg-coral px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-burgundy"
              >
                {t('form.continue')}
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-full bg-burgundy px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-coral disabled:opacity-50"
              >
                {submitting ? t('common.loading') : t('form.submit')}
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] text-warm-gray">
            {locale === 'id'
              ? 'Pendaftaran Anda disimpan otomatis. Bookmark URL ini untuk melanjutkan nanti.'
              : 'Your application is auto-saved. Bookmark this URL to continue later.'}
          </p>
        </div>
      </section>
    </main>
  );
}

// ============================================================================
// Form Steps
// ============================================================================

interface StepProps {
  app: Application;
  update: (field: keyof Application, value: any) => void;
  errors: Record<string, string>;
  locale: Locale;
}

function Step1({ app, update, errors, locale }: StepProps) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Mulai dari dasar' : 'Start with the basics'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id' ? 'Cerita siapa Anda dan dari mana.' : 'Tell us who you are and where you are.'}
      </p>

      <div className="space-y-5">
        <Field
          label={locale === 'id' ? 'Nama lengkap' : 'Full name'}
          value={app.full_name || ''}
          onChange={(v) => update('full_name', v)}
          error={errors.full_name}
          placeholder={locale === 'id' ? 'Nama Anda' : 'Your name'}
        />
        <Field
          label={locale === 'id' ? 'Nama bisnis / brand' : 'Business or brand name'}
          value={app.business_name || ''}
          onChange={(v) => update('business_name', v)}
          error={errors.business_name}
          placeholder={locale === 'id' ? 'Nama bisnis villa Anda' : 'Your villa business name'}
        />
        <Field
          label="Email"
          type="email"
          value={app.email || ''}
          onChange={(v) => update('email', v)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <Field
          label="WhatsApp"
          type="tel"
          value={app.whatsapp || ''}
          onChange={(v) => update('whatsapp', v)}
          error={errors.whatsapp}
          placeholder="+62 812 ..."
          hint={locale === 'id' ? 'Untuk pengumuman dan voting.' : 'For announcements and voting.'}
        />
        <Field
          label={locale === 'id' ? 'Lokasi di Bali' : 'Location in Bali'}
          value={app.location || ''}
          onChange={(v) => update('location', v)}
          error={errors.location}
          placeholder={locale === 'id' ? 'Cth. Berawa, Pererenan' : 'e.g. Berawa, Pererenan'}
        />

        <RadioGroup
          label={locale === 'id' ? 'Hadir di Villa Connect 2026?' : 'Attending Villa Connect 2026?'}
          value={app.attending_villa_connect || ''}
          onChange={(v) => update('attending_villa_connect', v)}
          options={[
            { value: 'yes', label: locale === 'id' ? 'Ya' : 'Yes' },
            { value: 'maybe', label: locale === 'id' ? 'Mungkin' : 'Maybe' },
            { value: 'no', label: locale === 'id' ? 'Tidak' : 'No' },
          ]}
        />
      </div>
    </div>
  );
}

function Step2({ app, update, errors, locale }: StepProps) {
  const channelOptions = [
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'booking', label: 'Booking.com' },
    { value: 'agoda', label: 'Agoda' },
    { value: 'vrbo', label: 'Vrbo' },
    { value: 'direct', label: locale === 'id' ? 'Direct booking' : 'Direct booking' },
    { value: 'other', label: locale === 'id' ? 'Lainnya' : 'Other' },
  ];

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Bisnis Anda dalam angka' : 'Your business in numbers'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id' ? 'Ini menentukan kategori Anda.' : 'This determines your category.'}
      </p>

      <div className="space-y-5">
        <Field
          label={locale === 'id' ? 'Berapa villa yang Anda kelola?' : 'How many villas do you operate?'}
          type="number"
          value={app.villa_count?.toString() || ''}
          onChange={(v) => update('villa_count', v ? parseInt(v) : null)}
          error={errors.villa_count}
          placeholder="3"
          hint={
            locale === 'id'
              ? '1–3 = Boutique, 4–9 = Growing, 10+ = Scaled'
              : '1–3 = Boutique, 4–9 = Growing, 10+ = Scaled'
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={locale === 'id' ? 'Tahun pengalaman' : 'Years hosting'}
            type="number"
            value={app.years_hosting?.toString() || ''}
            onChange={(v) => update('years_hosting', v ? parseInt(v) : null)}
            placeholder="5"
          />
          <Field
            label={locale === 'id' ? 'Jumlah tim' : 'Team size'}
            type="number"
            value={app.team_size?.toString() || ''}
            onChange={(v) => update('team_size', v ? parseInt(v) : null)}
            placeholder="4"
          />
        </div>

        <Field
          label={locale === 'id' ? 'Rata-rata okupansi (%)' : 'Average occupancy (%)'}
          type="number"
          value={app.occupancy_pct?.toString() || ''}
          onChange={(v) => update('occupancy_pct', v ? parseInt(v) : null)}
          placeholder="72"
          hint={locale === 'id' ? '6 bulan terakhir' : 'last 6 months'}
        />

        <CheckboxGroup
          label={locale === 'id' ? 'Saluran booking' : 'Booking channels'}
          values={app.channels || []}
          onChange={(vals) => update('channels', vals)}
          options={channelOptions}
          error={errors.channels}
        />
      </div>
    </div>
  );
}

function Step3Quick({ app, update, locale }: StepProps) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Pitch singkat' : 'Quick pitch'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id'
          ? 'Satu kalimat yang akan tampil di halaman publik Anda.'
          : 'One sentence that appears on your public page.'}
      </p>

      <div className="space-y-7">
        <Textarea
          label={locale === 'id' ? 'Pitch Anda (maks 280 karakter)' : 'Your pitch (max 280 chars)'}
          value={app.short_pitch || ''}
          onChange={(v) => update('short_pitch', v)}
          max={280}
          placeholder={
            locale === 'id'
              ? 'Cth. Kami mengelola 3 villa boutique di Pererenan dengan fokus pada pengalaman tamu...'
              : 'e.g. We run 3 boutique villas in Pererenan with a focus on guest experience...'
          }
          rows={4}
        />

        <PhotoUpload
          continueToken={app.continue_token}
          currentUrl={app.hero_photo_url}
          onUploaded={(url) => update('hero_photo_url', url)}
          onRemoved={() => update('hero_photo_url', null)}
          locale={locale}
        />

        <div className="space-y-3 border-t border-line pt-6">
          <CheckboxField
            label={
              locale === 'id'
                ? 'Saya bersedia menjadi case study'
                : "I'm open to being featured as a case study"
            }
            checked={app.willing_for_case_study || false}
            onChange={(v) => update('willing_for_case_study', v)}
          />
          <CheckboxField
            label={
              locale === 'id'
                ? 'Saya setuju nama saya ditampilkan di halaman publik'
                : 'I consent to my name being shown on the public page'
            }
            checked={app.consent_to_publish_name || false}
            onChange={(v) => update('consent_to_publish_name', v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step3Deep({ app, update, errors, locale }: StepProps) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Setup Anda saat ini' : 'Your current setup'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id' ? 'Apa yang Anda gunakan, dan apa yang tidak berfungsi.' : 'What you use, and what isn\'t working.'}
      </p>

      <div className="space-y-5">
        <Textarea
          label={locale === 'id' ? 'Tools apa yang Anda gunakan sekarang?' : 'What tools do you use today?'}
          value={app.current_tools || ''}
          onChange={(v) => update('current_tools', v)}
          error={errors.current_tools}
          max={500}
          placeholder={
            locale === 'id'
              ? 'Cth. Hostaway untuk PMS, Google Sheets untuk cleaning, WhatsApp untuk tim...'
              : 'e.g. Hostaway for PMS, Google Sheets for cleaning, WhatsApp for team...'
          }
        />
        <Textarea
          label={locale === 'id' ? 'Apa yang berjalan baik?' : 'What works well?'}
          value={app.current_tools_pros || ''}
          onChange={(v) => update('current_tools_pros', v)}
          max={500}
          rows={3}
        />
        <Textarea
          label={locale === 'id' ? 'Apa yang tidak?' : "What doesn't?"}
          value={app.current_tools_cons || ''}
          onChange={(v) => update('current_tools_cons', v)}
          max={500}
          rows={3}
        />
      </div>
    </div>
  );
}

function Step4Deep({ app, update, errors, locale }: StepProps) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Cerita Anda' : 'Your story'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id'
          ? 'Bagian inti. Ini yang akan dilihat juri dan publik.'
          : 'The heart of it. Jury and public will read this.'}
      </p>

      <div className="space-y-5">
        <Textarea
          label={locale === 'id' ? 'Masalah operasional terbesar Anda' : 'Your biggest operational headache'}
          value={app.biggest_headache || ''}
          onChange={(v) => update('biggest_headache', v)}
          error={errors.biggest_headache}
          max={500}
          hint={
            locale === 'id'
              ? 'Spesifik. "Koordinasi cleaning 4 villa saat high-season turnover."'
              : 'Be specific. "Cleaning coordination across 4 villas during high-season turnover."'
          }
        />
        <Textarea
          label={locale === 'id' ? 'Apa yang akan Anda tangani pertama dengan Elev8 Suite OS?' : 'What would you attack first with Elev8 Suite OS?'}
          value={app.first_attack || ''}
          onChange={(v) => update('first_attack', v)}
          error={errors.first_attack}
          max={500}
        />
        <Textarea
          label={locale === 'id' ? 'Visi 12 bulan' : '12-month vision'}
          value={app.twelve_month_vision || ''}
          onChange={(v) => update('twelve_month_vision', v)}
          max={500}
          rows={3}
        />
        <Textarea
          label={locale === 'id' ? 'Mengapa Anda?' : 'Why you?'}
          value={app.why_you || ''}
          onChange={(v) => update('why_you', v)}
          error={errors.why_you}
          max={1000}
          rows={6}
          hint={locale === 'id' ? 'Tanpa basa-basi. Yakinkan kami.' : 'No fluff. Make the case.'}
        />
      </div>
    </div>
  );
}

function Step5Deep({ app, update, locale }: StepProps) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl leading-tight text-navy">
        {locale === 'id' ? 'Hampir selesai' : 'Almost done'}
      </h2>
      <p className="mb-7 text-sm text-warm-gray">
        {locale === 'id' ? 'Untuk halaman publik dan share preview.' : 'For your public page and share preview.'}
      </p>

      <div className="space-y-7">
        <Textarea
          label={locale === 'id' ? 'Pitch singkat (untuk share preview)' : 'Short pitch (for share preview)'}
          value={app.short_pitch || ''}
          onChange={(v) => update('short_pitch', v)}
          max={280}
          placeholder={
            locale === 'id' ? 'Cth. Kami mengelola 3 villa di Pererenan...' : 'e.g. We run 3 villas in Pererenan...'
          }
          rows={3}
        />

        <PhotoUpload
          continueToken={app.continue_token}
          currentUrl={app.hero_photo_url}
          onUploaded={(url) => update('hero_photo_url', url)}
          onRemoved={() => update('hero_photo_url', null)}
          locale={locale}
        />

        <VoiceRecorder
          continueToken={app.continue_token}
          currentUrl={app.share_voice_message_url}
          onUploaded={(url) => update('share_voice_message_url', url)}
          onRemoved={() => update('share_voice_message_url', null)}
          locale={locale}
        />

        <div className="space-y-3 border-t border-line pt-6">
          <CheckboxField
            label={
              locale === 'id'
                ? 'Saya bersedia menjadi case study'
                : "I'm open to being featured as a case study"
            }
            checked={app.willing_for_case_study || false}
            onChange={(v) => update('willing_for_case_study', v)}
          />
          <CheckboxField
            label={
              locale === 'id'
                ? 'Saya setuju nama saya & cerita saya ditampilkan di halaman publik'
                : 'I consent to my name & story being shown on the public page'
            }
            checked={app.consent_to_publish_name || false}
            onChange={(v) => update('consent_to_publish_name', v)}
          />
        </div>

        <div className="rounded-2xl bg-cream p-5">
          <p className="text-sm leading-relaxed text-navy/80">
            <strong>
              {locale === 'id' ? 'Setelah submit:' : 'After you submit:'}
            </strong>{' '}
            {locale === 'id'
              ? 'Anda akan menerima konfirmasi email & WhatsApp dengan link halaman publik Anda untuk dibagikan.'
              : 'You\'ll receive an email & WhatsApp confirmation with the link to your public page to share.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UI Components
// ============================================================================

function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-sm focus:outline-none ${
          error ? 'border-burgundy' : 'border-line focus:border-coral'
        }`}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-warm-gray">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-burgundy">{error}</p>}
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  max = 500,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  max?: number;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-none rounded-xl border-[1.5px] bg-white px-4 py-3 text-sm leading-relaxed focus:outline-none ${
          error ? 'border-burgundy' : 'border-line focus:border-coral'
        }`}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-warm-gray">{hint || ''}</span>
        <span className="font-mono text-[11px] text-warm-gray">
          {value.length}/{max}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-burgundy">{error}</p>}
    </div>
  );
}

function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-navy">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border-[1.5px] py-3 text-sm font-semibold transition-all ${
              value === opt.value
                ? 'border-coral bg-coral text-white'
                : 'border-line bg-white text-navy hover:border-coral/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  values,
  onChange,
  options,
  error,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-navy">{label}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-xl border-[1.5px] py-2.5 text-sm font-semibold transition-all ${
              values.includes(opt.value)
                ? 'border-coral bg-coral text-white'
                : 'border-line bg-white text-navy hover:border-coral/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-burgundy">{error}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:bg-cream">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-coral"
      />
      <span className="text-sm text-navy">{label}</span>
    </label>
  );
}

// Helper: extract only updatable fields
function extractUpdates(app: Application): Partial<Application> {
  const {
    id,
    continue_token,
    status,
    ...updates
  } = app;
  // Convert nulls to undefined, drop empty strings on URL fields handled by backend
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== null && v !== undefined) cleaned[k] = v;
  }
  return cleaned;
}
