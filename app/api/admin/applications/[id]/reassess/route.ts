// ============================================================================
// POST /api/admin/applications/[id]/reassess
//
// Re-run the AI assessment for an existing application.
// Useful for:
//  - Backfilling submissions that pre-date the AI persistence feature
//  - Recovering from a failed initial assessment
//  - Re-running after prompt changes
//
// Requires admin role. Updates ai_* fields and ai_assessed_at on the row.
// Does NOT re-trigger admin notification email or follow-up scheduling
// (those happen on initial submit).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import { generateApplicationAssessment } from '@/lib/ai/assessment';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ---------- Auth: require admin ----------
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
      { error: 'Only admins can re-run AI assessments' },
      { status: 403 }
    );
  }

  // ---------- Fetch application ----------
  const { data: app, error: fetchErr } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // ---------- Run AI assessment ----------
  console.log(`[REASSESS] Triggered by admin=${me.id} for app=${params.id}`);

  let assessment;
  try {
    assessment = await generateApplicationAssessment({
      business_name: app.business_name || 'Unknown',
      full_name: app.full_name || 'Unknown',
      category: app.category || 'unknown',
      location: app.location,
      villa_count: app.villa_count,
      years_hosting: app.years_hosting,
      team_size: app.team_size,
      occupancy_pct: app.occupancy_pct,
      channels: app.channels || [],
      short_pitch: app.short_pitch,
      current_tools: app.current_tools,
      current_tools_pros: app.current_tools_pros,
      current_tools_cons: app.current_tools_cons,
      biggest_headache: app.biggest_headache,
      first_attack: app.first_attack,
      twelve_month_vision: app.twelve_month_vision,
      why_you: app.why_you,
      mode: app.mode || 'quick',
      language: app.language || 'en',
    });
  } catch (err: any) {
    console.error('[REASSESS] AI call failed:', err);
    return NextResponse.json(
      { error: `AI assessment failed: ${err?.message || 'unknown'}` },
      { status: 500 }
    );
  }

  if (!assessment) {
    return NextResponse.json(
      { error: 'AI returned no assessment (likely missing API key)' },
      { status: 500 }
    );
  }

  // ---------- Persist ----------
  const { error: updateErr } = await supabaseAdmin
    .from('applications')
    .update({
      ai_story_score: assessment.story_score,
      ai_growth_score: assessment.growth_score,
      ai_summary: assessment.summary,
      ai_recommendation: assessment.recommendation,
      ai_red_flags: assessment.red_flags,
      ai_category_fit: assessment.category_fit,
      ai_assessed_at: new Date().toISOString(),
      // Also update followup_questions if any (admin can decide if to send)
      followup_questions:
        assessment.followup_questions.length > 0 ? assessment.followup_questions : null,
    })
    .eq('id', params.id);

  if (updateErr) {
    console.error('[REASSESS] DB update failed:', updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  console.log(
    `[REASSESS] Done: app=${params.id} story=${assessment.story_score} growth=${assessment.growth_score} fit=${assessment.category_fit}`
  );

  return NextResponse.json({
    ok: true,
    assessment: {
      story_score: assessment.story_score,
      growth_score: assessment.growth_score,
      summary: assessment.summary,
      recommendation: assessment.recommendation,
      red_flags: assessment.red_flags,
      category_fit: assessment.category_fit,
      followup_questions_count: assessment.followup_questions.length,
    },
  });
}
