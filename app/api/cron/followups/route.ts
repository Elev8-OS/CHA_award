// ============================================================================
// GET /api/cron/followups
// Sends AI follow-up WhatsApp messages that are due.
//
// Triggered by Railway Cron every 5 minutes:
//   */5 * * * *  curl https://awards.elev8-suite.com/api/cron/followups
//
// Authorization: Header `x-cron-secret` must match CRON_SECRET env var.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendFollowupQuestion } from '@/lib/whatsapp/templates';
import { sendFollowupQuestionEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FollowupQuestion {
  field: string;
  question: string;
  question_id: string;
  reason: string;
}

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Find due follow-ups
  const { data: dueApps, error } = await supabaseAdmin
    .from('applications')
    .select(
      'id, full_name, email, whatsapp, language, continue_token, followup_questions, followup_scheduled_at'
    )
    .lte('followup_scheduled_at', now)
    .is('followup_sent_at', null)
    .not('followup_scheduled_at', 'is', null)
    .limit(20); // safety: don't blast more than 20 per run

  if (error) {
    console.error('Cron followups query failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dueApps || dueApps.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No due followups' });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const app of dueApps) {
    try {
      const questions = (app.followup_questions || []) as FollowupQuestion[];
      if (questions.length === 0) {
        // Mark as "sent" anyway so we don't retry forever
        await supabaseAdmin
          .from('applications')
          .update({ followup_sent_at: new Date().toISOString() })
          .eq('id', app.id);
        continue;
      }

      const q = questions[0]; // first question = highest priority
      const locale = app.language === 'id' ? 'id' : 'en';
      const applicantName = app.full_name || 'there';

      // Send via Email AND WhatsApp in parallel — at least one will land
      let emailOk = false;
      let whatsappOk = false;
      const channelErrors: string[] = [];

      // Email — always attempted if we have an email
      if (app.email) {
        try {
          await sendFollowupQuestionEmail({
            to: app.email,
            locale,
            applicantName,
            questionEn: q.question,
            questionId: q.question_id,
            continueToken: app.continue_token,
            fieldFocus: q.field,
            applicationId: app.id,
          });
          emailOk = true;
          console.log(`[CRON] ✓ Followup email sent to ${app.email} (${app.id})`);
        } catch (err: any) {
          channelErrors.push(`email: ${err?.message || 'unknown'}`);
          console.error(`[CRON] ✗ Followup email failed for ${app.id}:`, err?.message);
        }
      }

      // WhatsApp — attempted if we have a number AND token configured
      if (app.whatsapp && process.env.WHATSAPP_ACCESS_TOKEN) {
        try {
          await sendFollowupQuestion({
            to: app.whatsapp,
            locale,
            applicantName,
            questionEn: q.question,
            questionId: q.question_id,
            continueToken: app.continue_token,
            fieldFocus: q.field,
            applicationId: app.id,
          });
          whatsappOk = true;
          console.log(`[CRON] ✓ Followup WhatsApp sent to ${app.whatsapp} (${app.id})`);
        } catch (err: any) {
          channelErrors.push(`whatsapp: ${err?.message || 'unknown'}`);
          console.error(`[CRON] ✗ Followup WhatsApp failed for ${app.id}:`, err?.message);
        }
      }

      // Mark as sent if at least one channel succeeded
      if (emailOk || whatsappOk) {
        await supabaseAdmin
          .from('applications')
          .update({ followup_sent_at: new Date().toISOString() })
          .eq('id', app.id);
        sent++;
      } else {
        failed++;
        errors.push(`${app.id}: ${channelErrors.join(' | ') || 'no channel attempted'}`);
      }
    } catch (err: any) {
      failed++;
      const msg = `${app.id}: ${err?.message || 'unknown'}`;
      errors.push(msg);
      console.error(`[CRON] ✗ Follow-up loop failed for ${app.id}:`, err);
      // Don't mark as sent — will retry next cron run
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
