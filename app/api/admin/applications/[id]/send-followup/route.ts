// ============================================================================
// POST /api/admin/applications/[id]/send-followup
//
// Manually send the follow-up question(s) to the applicant right now,
// bypassing the 30-minute scheduled delay. Reuses the same delivery
// pipeline as the cron (email + WhatsApp in parallel).
//
// Useful for:
//   - Testing the followup flow end-to-end without waiting
//   - Sending immediately after re-assess (admin decides timing)
//   - Re-sending if applicant claims they didn't receive
//
// Requires admin role. Marks followup_sent_at on success.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import { sendFollowupQuestionEmail } from '@/lib/email/resend';
import { sendFollowupQuestion } from '@/lib/whatsapp/templates';

interface FollowupQuestion {
  field: string;
  question: string;
  question_id: string;
  reason: string;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ---------- Auth ----------
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: me } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!me || !me.is_active) {
    return NextResponse.json({ error: 'Not an active admin' }, { status: 403 });
  }
  if (me.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can send follow-ups manually' },
      { status: 403 }
    );
  }

  // ---------- Fetch app ----------
  const { data: app, error: fetchErr } = await supabaseAdmin
    .from('applications')
    .select(
      'id, full_name, email, whatsapp, language, continue_token, followup_questions, followup_sent_at'
    )
    .eq('id', params.id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const questions = (app.followup_questions || []) as FollowupQuestion[];
  if (questions.length === 0) {
    return NextResponse.json(
      { error: 'No follow-up questions on this application. Re-run AI assessment first.' },
      { status: 400 }
    );
  }

  if (!app.email && !app.whatsapp) {
    return NextResponse.json(
      { error: 'No contact channel (email or whatsapp) on this application' },
      { status: 400 }
    );
  }

  // ---------- Build common params ----------
  const questionItems = questions.map((q) => ({
    questionEn: q.question,
    questionId: q.question_id,
    fieldFocus: q.field,
  }));
  const locale = app.language === 'id' ? 'id' : 'en';
  const applicantName = app.full_name || 'there';

  let emailOk = false;
  let whatsappOk = false;
  const errors: string[] = [];

  console.log(
    `[SEND-FOLLOWUP] Manual trigger by admin=${me.id} for app=${params.id} (${questions.length} question(s))`
  );

  // ---------- Email ----------
  if (app.email) {
    try {
      await sendFollowupQuestionEmail({
        to: app.email,
        locale,
        applicantName,
        questions: questionItems,
        continueToken: app.continue_token,
        applicationId: app.id,
      });
      emailOk = true;
      console.log(`[SEND-FOLLOWUP] ✓ Email sent to ${app.email}`);
    } catch (err: any) {
      errors.push(`email: ${err?.message || 'unknown'}`);
      console.error(`[SEND-FOLLOWUP] ✗ Email failed:`, err?.message);
    }
  }

  // ---------- WhatsApp ----------
  if (app.whatsapp && process.env.WHATSAPP_ACCESS_TOKEN) {
    try {
      await sendFollowupQuestion({
        to: app.whatsapp,
        locale,
        applicantName,
        questions: questionItems,
        continueToken: app.continue_token || '',
        applicationId: app.id,
      });
      whatsappOk = true;
      console.log(`[SEND-FOLLOWUP] ✓ WhatsApp sent to ${app.whatsapp}`);
    } catch (err: any) {
      errors.push(`whatsapp: ${err?.message || 'unknown'}`);
      console.error(`[SEND-FOLLOWUP] ✗ WhatsApp failed:`, err?.message);
    }
  }

  // ---------- Mark as sent if at least one channel succeeded ----------
  if (emailOk || whatsappOk) {
    await supabaseAdmin
      .from('applications')
      .update({
        followup_sent_at: new Date().toISOString(),
        // Clear scheduled_at so cron doesn't re-pickup
        followup_scheduled_at: null,
      })
      .eq('id', params.id);

    return NextResponse.json({
      ok: true,
      emailSent: emailOk,
      whatsappSent: whatsappOk,
      questionCount: questions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  // All channels failed
  return NextResponse.json(
    { error: `All delivery channels failed: ${errors.join(' | ')}` },
    { status: 500 }
  );
}
