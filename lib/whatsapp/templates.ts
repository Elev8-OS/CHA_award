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

Terima kasih sudah mendaftar di *Canggu Host Awards 2026* 🏆

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
Powered by elev8`;
  }

  return `Hi ${name},

Thank you for applying to the *Canggu Host Awards 2026* 🏆

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
Powered by elev8`;
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
    return `*Canggu Host Awards 2026*

Kode konfirmasi suara Anda untuk *${applicantName}*:

*${otp}*

Kode berlaku 10 menit. Jika Anda tidak meminta kode ini, abaikan pesan ini.`;
  }

  return `*Canggu Host Awards 2026*

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

Anda terpilih sebagai *5 finalis teratas* di kategori *${opts.category}* di Canggu Host Awards 2026.

Pengumuman pemenang akan dilakukan langsung di panggung pada 26-27 Mei di Bali Villa Connect 2026.

Tiket gratis Anda akan dikirim segera. Halaman Anda: ${publicUrl}

Selamat! Sampai jumpa di panggung 🏆`
        : `🎉 *${opts.applicantName}*, you're a finalist!

You've been selected as a *Top 5 finalist* in the *${opts.category}* category of the Canggu Host Awards 2026.

Winners will be announced live on stage on May 26-27 at Bali Villa Connect 2026.

Your free ticket will be sent shortly. Your page: ${publicUrl}

Congratulations! See you on stage 🏆`;

    return await sendText({ to: opts.to, body, applicationId: opts.applicationId });
  }
}
