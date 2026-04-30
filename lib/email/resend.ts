// ============================================================================
// Email — Resend client with bilingual templates
// ============================================================================

import { Resend } from 'resend';
import type { Locale } from '@/lib/i18n/translations';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CHA Awards <awards@elev8-suite.com>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'hello@elev8-suite.com';

// ---------- Application Confirmation Email ----------

interface ApplicationConfirmationEmailOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  businessName: string;
  publicSlug: string;
  continueToken?: string;
}

export async function sendApplicationConfirmationEmail(opts: ApplicationConfirmationEmailOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;

  const subject =
    opts.locale === 'id'
      ? `🏆 Pendaftaran ${opts.businessName} diterima — Canggu Host Awards 2026`
      : `🏆 Your application for ${opts.businessName} is in — Canggu Host Awards 2026`;

  const html = renderApplicationConfirmationHtml(opts, publicUrl);
  const text = renderApplicationConfirmationText(opts, publicUrl);

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
  });
}

function renderApplicationConfirmationHtml(
  opts: ApplicationConfirmationEmailOpts,
  publicUrl: string
): string {
  const isId = opts.locale === 'id';

  const greeting = isId ? `Halo ${opts.applicantName},` : `Hi ${opts.applicantName},`;
  const intro = isId
    ? `Terima kasih sudah mendaftarkan <strong>${opts.businessName}</strong> di Canggu Host Awards 2026.`
    : `Thank you for entering <strong>${opts.businessName}</strong> into the Canggu Host Awards 2026.`;
  const yourPage = isId ? 'Halaman publik Anda' : 'Your public page';
  const shareCta = isId
    ? 'Bagikan halaman ini dengan jaringan Anda. Setiap suara membawa Anda lebih dekat ke panggung di Bali Villa Connect 2026.'
    : 'Share this page with your network. Every vote brings you closer to the stage at Bali Villa Connect 2026.';
  const viewPage = isId ? 'Lihat halaman Anda →' : 'View your page →';
  const keyDates = isId ? 'Tanggal penting' : 'Key dates';
  const date1 = isId ? '22 Mei 23:59 WITA — Pendaftaran ditutup' : '22 May 23:59 WITA — Submissions close';
  const date2 = isId ? '25 Mei — 5 finalis diumumkan' : '25 May — Top 5 finalists revealed';
  const date3 = isId ? '26-27 Mei — Pengumuman pemenang di panggung' : '26-27 May — Winners announced on stage';
  const questions = isId
    ? 'Pertanyaan? Balas email ini, kami akan menjawab.'
    : 'Questions? Just reply to this email — we read every message.';
  const signature = isId
    ? `Salam,<br><strong>Canggu Hospitality Association</strong><br><span style="color:#6B6055;">Powered by elev8 — Diamond Sponsor</span>`
    : `Best,<br><strong>Canggu Hospitality Association</strong><br><span style="color:#6B6055;">Powered by elev8 — Diamond Sponsor</span>`;

  return `<!doctype html>
<html lang="${opts.locale}">
<head>
<meta charset="utf-8">
<title></title>
</head>
<body style="margin:0;padding:0;background:#F8F2E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1F3A4F;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2E8;padding:40px 20px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(135deg, #D4663F 0%, #7A2935 100%);padding:32px 32px 28px 32px;text-align:center;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#E8A93C;margin-bottom:8px;">Canggu Host Awards 2026</div>
            <div style="font-family:Georgia,serif;font-size:28px;color:#FFFFFF;line-height:1.2;">
              ${isId ? 'Pendaftaran diterima' : 'Application received'} 🏆
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#1F3A4F;">${greeting}</p>
            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#1F3A4F;">${intro}</p>

            <!-- CTA Box -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#F8F2E8;border-radius:12px;padding:24px;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#D4663F;margin-bottom:8px;">${yourPage}</div>
                  <div style="font-size:14px;color:#1F3A4F;margin-bottom:16px;">${shareCta}</div>
                  <a href="${publicUrl}" style="display:inline-block;background:#D4663F;color:#FFFFFF;font-weight:700;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none;">${viewPage}</a>
                  <div style="margin-top:14px;font-size:12px;color:#6B6055;font-family:monospace;word-break:break-all;">${publicUrl}</div>
                </td>
              </tr>
            </table>

            <!-- Key dates -->
            <div style="margin:32px 0 24px 0;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1F8A7A;margin-bottom:12px;">${keyDates}</div>
              <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;color:#1F3A4F;">
                <li>${date1}</li>
                <li>${date2}</li>
                <li>${date3}</li>
              </ul>
            </div>

            <p style="margin:24px 0 0 0;font-size:14px;line-height:1.6;color:#6B6055;">${questions}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1F3A4F;padding:28px 32px;text-align:center;color:#F8F2E8;">
            <div style="font-size:14px;line-height:1.6;">${signature}</div>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;font-size:11px;color:#6B6055;text-align:center;">
        © 2026 Canggu Hospitality Association · Edition 01
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function renderApplicationConfirmationText(
  opts: ApplicationConfirmationEmailOpts,
  publicUrl: string
): string {
  const isId = opts.locale === 'id';
  if (isId) {
    return `Halo ${opts.applicantName},

Terima kasih sudah mendaftarkan ${opts.businessName} di Canggu Host Awards 2026.

HALAMAN PUBLIK ANDA:
${publicUrl}

Bagikan halaman ini dengan jaringan Anda. Setiap suara membawa Anda lebih dekat ke panggung di Bali Villa Connect 2026.

TANGGAL PENTING:
- 22 Mei 23:59 WITA — Pendaftaran ditutup
- 25 Mei — 5 finalis diumumkan
- 26-27 Mei — Pengumuman pemenang di panggung

Pertanyaan? Balas email ini.

Salam,
Canggu Hospitality Association
Powered by elev8 — Diamond Sponsor`;
  }
  return `Hi ${opts.applicantName},

Thank you for entering ${opts.businessName} into the Canggu Host Awards 2026.

YOUR PUBLIC PAGE:
${publicUrl}

Share this page with your network. Every vote brings you closer to the stage at Bali Villa Connect 2026.

KEY DATES:
- 22 May 23:59 WITA — Submissions close
- 25 May — Top 5 finalists revealed
- 26-27 May — Winners announced on stage

Questions? Just reply to this email — we read every message.

Best,
Canggu Hospitality Association
Powered by elev8 — Diamond Sponsor`;
}

// ---------- Save & Continue Email ----------

interface SaveContinueEmailOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  continueUrl: string;
}

export async function sendSaveContinueEmail(opts: SaveContinueEmailOpts) {
  const subject =
    opts.locale === 'id'
      ? '✏️ Lanjutkan pendaftaran Anda — CHA Awards 2026'
      : '✏️ Continue your application — CHA Awards 2026';

  const greeting = opts.locale === 'id' ? `Halo ${opts.applicantName},` : `Hi ${opts.applicantName},`;
  const intro = opts.locale === 'id'
    ? 'Anda menyimpan pendaftaran Anda. Lanjutkan kapan saja sebelum 22 Mei dengan link di bawah:'
    : 'You saved your application. Resume anytime before 22 May with the link below:';
  const cta = opts.locale === 'id' ? 'Lanjutkan pendaftaran →' : 'Continue application →';

  const html = `<!doctype html>
<html><body style="margin:0;padding:40px 20px;background:#F8F2E8;font-family:-apple-system,sans-serif;color:#1F3A4F;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:36px;">
  <p style="font-size:16px;line-height:1.6;">${greeting}</p>
  <p style="font-size:16px;line-height:1.6;">${intro}</p>
  <p style="margin:32px 0;text-align:center;">
    <a href="${opts.continueUrl}" style="display:inline-block;background:#D4663F;color:#FFFFFF;font-weight:700;padding:14px 28px;border-radius:100px;text-decoration:none;">${cta}</a>
  </p>
  <p style="font-size:12px;color:#6B6055;word-break:break-all;font-family:monospace;">${opts.continueUrl}</p>
</div>
</body></html>`;

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    replyTo: REPLY_TO,
    subject,
    html,
  });
}

// ============================================================================
// Milestone Emails — Shortlist / Finalist / Winner
// ============================================================================

const COLORS = {
  coral: '#D4663F',
  teal: '#1F8A7A',
  burgundy: '#7A2935',
  gold: '#E8A93C',
  navy: '#1F3A4F',
  cream: '#F8F2E8',
  warmGray: '#6B6055',
};

interface MilestoneEmailOpts {
  to: string;
  locale: Locale;
  applicantName: string;
  businessName: string;
  category: string;
  publicSlug: string;
}

// ---------- Shortlist (Top 10) ----------

export async function sendShortlistEmail(opts: MilestoneEmailOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;
  const isId = opts.locale === 'id';

  const subject = isId
    ? `🌟 ${opts.businessName} di Top 10 — CHA Awards 2026`
    : `🌟 ${opts.businessName} is in the Top 10 — CHA Awards 2026`;

  const html = renderMilestoneHtml({
    locale: opts.locale,
    headerColor: COLORS.teal,
    badge: isId ? 'TOP 10' : 'TOP 10',
    title: isId ? 'Anda dalam Shortlist' : 'You\'re shortlisted',
    greeting: isId ? `Halo ${opts.applicantName},` : `Hi ${opts.applicantName},`,
    intro: isId
      ? `Selamat. <strong>${opts.businessName}</strong> terpilih dalam Top 10 kategori <strong>${opts.category}</strong> di Canggu Host Awards 2026.`
      : `Congratulations. <strong>${opts.businessName}</strong> has been shortlisted in the Top 10 of the <strong>${opts.category}</strong> category at the Canggu Host Awards 2026.`,
    rewardLabel: isId ? 'Apa yang Anda dapatkan' : 'What you get',
    rewardItems: isId
      ? [
          'Sesi strategi 1:1 dengan founder elev8 (30 menit)',
          'Audit operasional yang dipersonalisasi',
          'Tetap berpeluang masuk Top 5 finalis (diumumkan 25 Mei)',
        ]
      : [
          '1:1 strategy session with elev8 founders (30 min)',
          'Personalized operational audit',
          'Still in the running for Top 5 finalists (revealed 25 May)',
        ],
    nextSteps: isId
      ? 'Tim kami akan menghubungi Anda dalam 48 jam untuk menjadwalkan sesi strategi.'
      : 'Our team will reach out within 48 hours to schedule your strategy session.',
    ctaUrl: publicUrl,
    ctaLabel: isId ? 'Lihat halaman publik Anda' : 'View your public page',
  });

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    replyTo: REPLY_TO,
    subject,
    html,
  });
}

// ---------- Finalist (Top 5) ----------

export async function sendFinalistEmail(opts: MilestoneEmailOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;
  const isId = opts.locale === 'id';

  const subject = isId
    ? `🏆 ${opts.businessName} adalah Finalis — CHA Awards 2026`
    : `🏆 ${opts.businessName} is a Finalist — CHA Awards 2026`;

  const html = renderMilestoneHtml({
    locale: opts.locale,
    headerColor: COLORS.coral,
    badge: isId ? 'FINALIS · TOP 5' : 'FINALIST · TOP 5',
    title: isId ? 'Anda Finalis 🎉' : 'You\'re a Finalist 🎉',
    greeting: isId ? `Halo ${opts.applicantName},` : `Hi ${opts.applicantName},`,
    intro: isId
      ? `Anda adalah <strong>Finalis Top 5</strong> di kategori <strong>${opts.category}</strong>. Pemenang akan diumumkan langsung di panggung Bali Villa Connect 2026.`
      : `You are a <strong>Top 5 Finalist</strong> in the <strong>${opts.category}</strong> category. Winners will be announced live on stage at Bali Villa Connect 2026.`,
    rewardLabel: isId ? 'Apa yang Anda dapatkan' : 'What you get',
    rewardItems: isId
      ? [
          'Tiket gratis Bali Villa Connect 2026',
          'Tempat duduk khusus finalis di acara',
          'Disebut langsung di panggung',
          'Kesempatan menang USD 2.155 dalam paket elev8',
        ]
      : [
          'Free ticket to Bali Villa Connect 2026',
          'Reserved finalist seating at the event',
          'Named live on stage',
          'Chance to win the USD 2,155 elev8 package',
        ],
    nextSteps: isId
      ? '26-27 Mei — Bali Sunset Road Convention Center. Tiket dan info acara akan dikirim terpisah dalam 24 jam.'
      : '26-27 May — Bali Sunset Road Convention Center. Ticket and event details follow within 24 hours.',
    ctaUrl: publicUrl,
    ctaLabel: isId ? 'Halaman Anda' : 'Your page',
  });

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    replyTo: REPLY_TO,
    subject,
    html,
  });
}

// ---------- Winner ----------

export async function sendWinnerEmail(opts: MilestoneEmailOpts) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const publicUrl = `${siteUrl}/v/${opts.publicSlug}`;
  const isId = opts.locale === 'id';

  const subject = isId
    ? `🏆 ${opts.businessName} MENANG — CHA Awards 2026`
    : `🏆 ${opts.businessName} WON — CHA Awards 2026`;

  const html = renderMilestoneHtml({
    locale: opts.locale,
    headerColor: COLORS.gold,
    badge: isId ? '🏆 PEMENANG' : '🏆 WINNER',
    title: isId ? 'Anda Pemenangnya' : 'You won',
    greeting: isId ? `Halo ${opts.applicantName},` : `Hi ${opts.applicantName},`,
    intro: isId
      ? `Selamat. <strong>${opts.businessName}</strong> adalah pemenang kategori <strong>${opts.category}</strong> di Canggu Host Awards 2026 — Edisi 01.`
      : `Congratulations. <strong>${opts.businessName}</strong> is the winner of the <strong>${opts.category}</strong> category at the Canggu Host Awards 2026 — Edition 01.`,
    rewardLabel: isId ? 'Hadiah Anda' : 'Your prize',
    rewardItems: isId
      ? [
          '1 tahun langganan elev8 untuk 2 villa',
          'Onboarding personal dengan founder elev8',
          'Migrasi data langsung dari setup Anda saat ini',
          'Senilai total USD 2.155',
        ]
      : [
          '1-year elev8 subscription for 2 villas',
          'Personal onboarding with elev8 founders',
          'Live data migration from your current setup',
          'Total value: USD 2,155',
        ],
    nextSteps: isId
      ? 'Tim kami akan menghubungi Anda dalam 24 jam untuk memulai onboarding. Sebagai pemenang Edisi 01, kisah Anda akan ditampilkan di kampanye CHA & elev8 ke depan.'
      : 'Our team will be in touch within 24 hours to kick off onboarding. As an Edition 01 winner, your story will be featured in upcoming CHA & elev8 campaigns.',
    ctaUrl: publicUrl,
    ctaLabel: isId ? 'Halaman pemenang Anda' : 'Your winner page',
  });

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    replyTo: REPLY_TO,
    subject,
    html,
  });
}

// ---------- Shared HTML renderer for milestone emails ----------

interface MilestoneTemplateOpts {
  locale: Locale;
  headerColor: string;
  badge: string;
  title: string;
  greeting: string;
  intro: string;
  rewardLabel: string;
  rewardItems: string[];
  nextSteps: string;
  ctaUrl: string;
  ctaLabel: string;
}

function renderMilestoneHtml(o: MilestoneTemplateOpts): string {
  return `<!doctype html>
<html lang="${o.locale}">
<head><meta charset="utf-8"><title></title></head>
<body style="margin:0;padding:0;background:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLORS.navy};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};padding:40px 20px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:${o.headerColor};padding:48px 32px 40px 32px;text-align:center;color:#FFFFFF;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;margin-bottom:14px;opacity:0.85;">${o.badge}</div>
            <div style="font-family:Georgia,serif;font-size:36px;line-height:1.15;">${o.title}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">${o.greeting}</p>
            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;">${o.intro}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:${COLORS.cream};border-radius:12px;padding:24px;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:${o.headerColor};margin-bottom:14px;">${o.rewardLabel.toUpperCase()}</div>
                  <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.8;color:${COLORS.navy};">
                    ${o.rewardItems.map((item) => `<li>${item}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0;font-size:14px;line-height:1.6;color:${COLORS.warmGray};">${o.nextSteps}</p>

            <p style="margin:32px 0 0 0;text-align:center;">
              <a href="${o.ctaUrl}" style="display:inline-block;background:${COLORS.coral};color:#FFFFFF;font-weight:700;font-size:14px;padding:14px 28px;border-radius:100px;text-decoration:none;">${o.ctaLabel}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:${COLORS.navy};padding:28px 32px;text-align:center;color:${COLORS.cream};">
            <div style="font-size:14px;line-height:1.6;"><strong>Canggu Hospitality Association</strong><br><span style="color:${COLORS.gold};">Powered by elev8 — Diamond Sponsor</span></div>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;font-size:11px;color:${COLORS.warmGray};text-align:center;">© 2026 Canggu Hospitality Association · Edition 01</div>
    </td>
  </tr>
</table>
</body></html>`;
}
