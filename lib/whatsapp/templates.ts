// ============================================================================
// WhatsApp Message Templates
//
// Two layers:
// 1) Pre-approved Meta templates (preferred, works outside 24h window)
// 2) Free-form text fallbacks (only valid within 24h window after user replies)
//
// Templates to submit in Meta Business Manager:
// - award_application_received    (en + id)
// - award_finalist_notification   (en + id)
// - award_winner_notification     (en + id)
// - award_voting_otp              (en + id)
// ============================================================================

import { sendText, sendTemplate } from './client';
import type { Locale } from '@/lib/i18n/translations';

// ---------- Application Confirmation ----------

interface ApplicationConfirmationOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  publicSlug: string;
  applicationId: string;
}

export async function sendApplicationConfirmation(opts: ApplicationConfirmationOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  // Try template first (works outside 24h window)
  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_application_received',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: publicUrl },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    // Template not approved yet — fallback to text (only works in 24h window)
    const body = buildApplicationConfirmationText(opts.locale, opts.applicantName, publicUrl);
    return await sendText({
      to: opts.to,
      body,
      applicationId: opts.applicationId,
    });
  }
}

function buildApplicationConfirmationText(
  locale: Locale,
  name: string,
  publicUrl: string
): string {
  if (locale === 'id') {
    return `Halo ${name},

Terima kasih sudah mendaftar di *CHA Hospitality Awards 2026* 🏆

Pendaftaran Anda sudah kami terima. Berikut langkah selanjutnya:

📍 *Halaman publik Anda:*
${publicUrl}

Bagikan halaman ini dengan jaringan Anda agar mereka bisa memberikan suara untuk Anda. Setiap suara membawa Anda lebih dekat ke panggung di Bali Villa Connect 2026.

📅 *Tanggal penting:*
• 22 Mei 23:59 WITA — Pendaftaran ditutup
• 25 Mei — 5 finalis diumumkan
• 26-27 Mei — Pengumuman pemenang di panggung

Pertanyaan? Balas pesan ini.

Salam,
*Canggu Hospitality Association*
Powered by Elev8 Suite OS`;
  }

  return `Hi ${name},

Thank you for applying to the *CHA Hospitality Awards 2026* 🏆

Your application has been received. Here's what's next:

📍 *Your public page:*
${publicUrl}

Share this with your network so they can vote for you. Every vote brings you closer to the stage at Bali Villa Connect 2026.

📅 *Key dates:*
• 22 May 23:59 WITA — Submissions close
• 25 May — Top 5 finalists revealed
• 26-27 May — Winners announced on stage

Questions? Just reply to this message.

Best,
*Canggu Hospitality Association*
Powered by Elev8 Suite OS`;
}

// ---------- Voting OTP ----------

interface VotingOtpOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  otp: string;
}

export async function sendVotingOtp(opts: VotingOtpOpts) {
  // Try template first
  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_voting_otp',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.otp },
            { type: 'text', text: opts.applicantName },
          ],
        },
      ],
    });
  } catch (error) {
    // Fallback to text
    const body = buildVotingOtpText(opts.locale, opts.applicantName, opts.otp);
    return await sendText({ to: opts.to, body });
  }
}

function buildVotingOtpText(locale: Locale, applicantName: string, otp: string): string {
  if (locale === 'id') {
    return `*CHA Hospitality Awards 2026*

Kode konfirmasi suara Anda untuk *${applicantName}*:

*${otp}*

Kode berlaku 10 menit. Jika Anda tidak meminta kode ini, abaikan pesan ini.`;
  }

  return `*CHA Hospitality Awards 2026*

Your vote confirmation code for *${applicantName}*:

*${otp}*

Code valid for 10 minutes. If you didn't request this, ignore this message.`;
}

// ---------- Finalist Notification ----------

interface FinalistNotificationOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  category: string;
  publicSlug: string;
  applicationId: string;
}

export async function sendFinalistNotification(opts: FinalistNotificationOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_finalist_notification',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: opts.category },
            { type: 'text', text: publicUrl },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    const body =
      opts.locale === 'id'
        ? `🎉 *${opts.applicantName}*, Anda finalis!

Anda terpilih sebagai *5 finalis teratas* di kategori *${opts.category}* di CHA Hospitality Awards 2026.

Pengumuman pemenang akan dilakukan langsung di panggung pada 26-27 Mei di Bali Villa Connect 2026.

Tiket gratis Anda akan dikirim segera. Halaman Anda: ${publicUrl}

Selamat! Sampai jumpa di panggung 🏆`
        : `🎉 *${opts.applicantName}*, you're a finalist!

You've been selected as a *Top 5 finalist* in the *${opts.category}* category of the CHA Hospitality Awards 2026.

Winners will be announced live on stage on May 26-27 at Bali Villa Connect 2026.

Your free ticket will be sent shortly. Your page: ${publicUrl}

Congratulations! See you on stage 🏆`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}

// ---------- Submission Deadline Reminder ----------

interface SubmissionReminderOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  continueToken: string;
  hoursLeft: number;
  applicationId: string;
}

export async function sendSubmissionReminder(opts: SubmissionReminderOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const continueUrl = `${siteUrl}/apply/${opts.continueToken}`;

  // Try template first
  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_submission_reminder',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: opts.hoursLeft.toString() },
            { type: 'text', text: continueUrl },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    const body =
      opts.locale === 'id'
        ? `⏰ *${opts.applicantName}*, pendaftaran Anda belum selesai.

Hanya *${opts.hoursLeft} jam tersisa* untuk CHA Hospitality Awards 2026.

Lanjutkan di sini:
${continueUrl}

Pendaftaran ditutup 22 Mei 23:59 WITA.`
        : `⏰ *${opts.applicantName}*, your application isn't finished yet.

Only *${opts.hoursLeft} hours left* for the CHA Hospitality Awards 2026.

Continue here:
${continueUrl}

Submissions close 22 May 23:59 WITA.`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}

// ---------- Share Reminder (for applicants who submitted but haven't shared) ----------

interface ShareReminderOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  publicSlug: string;
  voteCount: number;
  applicationId: string;
}

export async function sendShareReminder(opts: ShareReminderOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_share_reminder',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: opts.voteCount.toString() },
            { type: 'text', text: publicUrl },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    const body =
      opts.locale === 'id'
        ? `🗳️ *${opts.applicantName}*, halaman Anda mendapat *${opts.voteCount} suara* sejauh ini.

Bagikan dengan jaringan Anda untuk mendapatkan lebih banyak dukungan:
${publicUrl}

Voting ditutup 22 Mei 23:59 WITA.`
        : `🗳️ *${opts.applicantName}*, your page has *${opts.voteCount} votes* so far.

Share with your network to gather more support:
${publicUrl}

Voting closes 22 May 23:59 WITA.`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}

// ---------- Shortlist Notification (Top 10) ----------

interface ShortlistNotificationOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  category: string;
  publicSlug: string;
  applicationId: string;
}

export async function sendShortlistNotification(opts: ShortlistNotificationOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_shortlist_notification',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: opts.category },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    const body =
      opts.locale === 'id'
        ? `🌟 *${opts.applicantName}*, Anda di Top 10!

Anda terpilih dalam shortlist *${opts.category}* di CHA Hospitality Awards 2026.

Anda mendapat *sesi strategi 1:1 dengan founder Elev8 Suite OS* — kami akan menghubungi Anda untuk menjadwalkan.

Halaman Anda: ${publicUrl}

Top 5 finalis diumumkan 25 Mei.`
        : `🌟 *${opts.applicantName}*, you're in the Top 10!

You've been shortlisted in *${opts.category}* at the CHA Hospitality Awards 2026.

You've earned a *1:1 strategy session with the Elev8 Suite OS founders* — we'll reach out to schedule.

Your page: ${publicUrl}

Top 5 finalists revealed 25 May.`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}

// ---------- Winner Notification ----------

interface WinnerNotificationOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  category: string;
  publicSlug: string;
  applicationId: string;
}

export async function sendWinnerNotification(opts: WinnerNotificationOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  try {
    return await sendTemplate({
      to: opts.to,
      templateName: 'award_winner_notification',
      languageCode: opts.locale,
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: opts.applicantName },
            { type: 'text', text: opts.category },
            { type: 'text', text: publicUrl },
          ],
        },
      ],
      applicationId: opts.applicationId,
    });
  } catch (error) {
    const body =
      opts.locale === 'id'
        ? `🏆 *${opts.applicantName}*, ANDA MENANG!

Anda adalah pemenang kategori *${opts.category}* di CHA Hospitality Awards 2026!

Hadiah Anda:
🎯 1 tahun Elev8 Suite OS untuk 2 villa
🎯 Onboarding personal & migrasi data
🎯 Senilai USD 2.155

Tim kami akan menghubungi Anda untuk onboarding.

Halaman Anda: ${publicUrl}

Selamat! 🎉`
        : `🏆 *${opts.applicantName}*, YOU WON!

You are the winner of the *${opts.category}* category at the CHA Hospitality Awards 2026!

Your prize:
🎯 1 year of Elev8 Suite OS for 2 villas
🎯 Personal onboarding & data migration
🎯 USD 2,155 value

Our team will be in touch for onboarding.

Your page: ${publicUrl}

Congratulations! 🎉`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}
