// ============================================================================
// GET/POST /api/cron/reminders
// Auth: Bearer CRON_SECRET in Authorization header
//
// Logic:
// 1. Find drafts whose owner has email/whatsapp, where deadline is approaching:
//    - 24h before deadline: send 24h reminder if not already sent
//    - 6h before deadline: send urgent reminder
// 2. Find submitted applications with low engagement (< 5 votes after 48h):
//    - Send "share more" reminder if not already sent
//
// Schedule via Railway Cron or external scheduler:
// - Run every 6 hours: */6 * * * *
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendSubmissionReminder,
  sendShareReminder,
} from '@/lib/whatsapp/templates';
import { sendSaveContinueEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ReminderResult {
  type: string;
  application_id: string;
  channel: string;
  success: boolean;
  error?: string;
}

async function verifyCronAuth(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.warn('CRON_SECRET not set — refusing cron request');
    return false;
  }
  return auth === `Bearer ${expected}`;
}

async function logCronRun(
  jobName: string,
  status: 'success' | 'failed',
  recordsProcessed: number,
  durationMs: number,
  errorMessage?: string
) {
  await supabaseAdmin.from('cron_runs').insert({
    job_name: jobName,
    status,
    records_processed: recordsProcessed,
    duration_ms: durationMs,
    error_message: errorMessage || null,
  });
}

async function alreadySentReminder(
  applicationId: string,
  reminderType: string,
  channel: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('reminder_sends')
    .select('id')
    .eq('application_id', applicationId)
    .eq('reminder_type', reminderType)
    .eq('channel', channel)
    .maybeSingle();
  return !!data;
}

async function recordReminder(
  applicationId: string,
  reminderType: string,
  channel: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  await supabaseAdmin
    .from('reminder_sends')
    .upsert(
      {
        application_id: applicationId,
        reminder_type: reminderType,
        channel,
        status,
        error_message: errorMessage || null,
        sent_at: new Date().toISOString(),
      },
      { onConflict: 'application_id,reminder_type,channel' }
    );
}

export async function GET(req: NextRequest) {
  return await handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return await handleCronRequest(req);
}

async function handleCronRequest(req: NextRequest) {
  const startedAt = Date.now();
  const results: ReminderResult[] = [];
  let errorMessage: string | undefined;

  try {
    if (!(await verifyCronAuth(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const closeAt = process.env.APPLICATIONS_CLOSE_AT
      ? new Date(process.env.APPLICATIONS_CLOSE_AT)
      : new Date('2026-05-22T23:59:59+08:00');

    const now = Date.now();
    const hoursUntilClose = (closeAt.getTime() - now) / (1000 * 60 * 60);

    // ----- Decide which reminder types to send -----
    const sendDraft24h = hoursUntilClose <= 24 && hoursUntilClose > 18;
    const sendDraft6h = hoursUntilClose <= 6 && hoursUntilClose > 0;
    const sendShareReminder24h = hoursUntilClose <= 48 && hoursUntilClose > 24;

    // ====================================================================
    // 1. SUBMISSION REMINDERS (drafts approaching deadline)
    // ====================================================================
    if (sendDraft24h || sendDraft6h) {
      const reminderType = sendDraft6h ? 'submission_6h' : 'submission_24h';
      const hoursLeft = sendDraft6h ? 6 : 24;

      const { data: drafts } = await supabaseAdmin
        .from('applications')
        .select('id, full_name, whatsapp, email, language, continue_token')
        .eq('status', 'draft')
        .not('full_name', 'is', null)
        .not('whatsapp', 'is', null);

      for (const app of drafts || []) {
        const locale = (app.language === 'id' ? 'id' : 'en') as 'id' | 'en';

        // WhatsApp reminder
        if (app.whatsapp && !(await alreadySentReminder(app.id, reminderType, 'whatsapp'))) {
          try {
            await sendSubmissionReminder({
              to: app.whatsapp,
              locale,
              applicantName: app.full_name || 'there',
              continueToken: app.continue_token,
              hoursLeft,
              applicationId: app.id,
            });
            await recordReminder(app.id, reminderType, 'whatsapp', 'sent');
            results.push({
              type: reminderType,
              application_id: app.id,
              channel: 'whatsapp',
              success: true,
            });
          } catch (e: any) {
            await recordReminder(app.id, reminderType, 'whatsapp', 'failed', e.message);
            results.push({
              type: reminderType,
              application_id: app.id,
              channel: 'whatsapp',
              success: false,
              error: e.message,
            });
          }
        }

        // Email reminder
        if (app.email && !(await alreadySentReminder(app.id, reminderType, 'email'))) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
          try {
            await sendSaveContinueEmail({
              to: app.email,
              locale,
              applicantName: app.full_name || 'there',
              continueUrl: `${siteUrl}/apply/${app.continue_token}`,
            });
            await recordReminder(app.id, reminderType, 'email', 'sent');
            results.push({
              type: reminderType,
              application_id: app.id,
              channel: 'email',
              success: true,
            });
          } catch (e: any) {
            await recordReminder(app.id, reminderType, 'email', 'failed', e.message);
            results.push({
              type: reminderType,
              application_id: app.id,
              channel: 'email',
              success: false,
              error: e.message,
            });
          }
        }
      }
    }

    // ====================================================================
    // 2. SHARE REMINDERS (low-vote submissions before deadline)
    // ====================================================================
    if (sendShareReminder24h) {
      // Find submitted applications with < 5 votes
      const { data: submittedLowVote } = await supabaseAdmin
        .from('public_applicant_view')
        .select('id, full_name, business_name, public_slug, vote_count');

      for (const app of submittedLowVote || []) {
        if ((app.vote_count || 0) >= 5) continue; // skip well-performing
        if (!app.id) continue;

        // Get full application for whatsapp + language
        const { data: fullApp } = await supabaseAdmin
          .from('applications')
          .select('whatsapp, language, status')
          .eq('id', app.id)
          .single();

        if (!fullApp || fullApp.status === 'draft' || !fullApp.whatsapp) continue;

        const reminderType = 'share_24h';
        if (await alreadySentReminder(app.id, reminderType, 'whatsapp')) continue;

        const locale = (fullApp.language === 'id' ? 'id' : 'en') as 'id' | 'en';

        try {
          await sendShareReminder({
            to: fullApp.whatsapp,
            locale,
            applicantName: app.full_name || app.business_name || 'there',
            publicSlug: app.public_slug || app.id,
            voteCount: app.vote_count || 0,
            applicationId: app.id,
          });
          await recordReminder(app.id, reminderType, 'whatsapp', 'sent');
          results.push({
            type: reminderType,
            application_id: app.id,
            channel: 'whatsapp',
            success: true,
          });
        } catch (e: any) {
          await recordReminder(app.id, reminderType, 'whatsapp', 'failed', e.message);
          results.push({
            type: reminderType,
            application_id: app.id,
            channel: 'whatsapp',
            success: false,
            error: e.message,
          });
        }
      }
    }

    const duration = Date.now() - startedAt;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await logCronRun('reminders', 'success', results.length, duration);

    return NextResponse.json({
      success: true,
      hours_until_close: Math.round(hoursUntilClose * 10) / 10,
      sent: {
        draft_24h: sendDraft24h,
        draft_6h: sendDraft6h,
        share_24h: sendShareReminder24h,
      },
      total: results.length,
      succeeded,
      failed,
      sample_errors: results
        .filter((r) => !r.success)
        .slice(0, 5)
        .map((r) => `${r.type}/${r.channel}: ${r.error}`),
    });
  } catch (error: any) {
    errorMessage = error.message || 'Unknown error';
    const duration = Date.now() - startedAt;
    await logCronRun('reminders', 'failed', results.length, duration, errorMessage);
    console.error('Cron reminders error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
