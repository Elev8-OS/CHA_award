// ============================================================================
// /api/admin/scores
// POST — Upsert a jury score for the current user on a specific application.
//        Bypasses RLS via service role; validates that caller is jury/admin.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // ---------- Auth ----------
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify user is an active admin/jury (use service role to bypass RLS)
  const { data: me } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!me || !me.is_active) {
    return NextResponse.json({ error: 'Not an active admin' }, { status: 403 });
  }
  if (me.role !== 'jury' && me.role !== 'admin') {
    return NextResponse.json(
      { error: `Your role (${me.role}) cannot score applications. Need 'jury' or 'admin'.` },
      { status: 403 }
    );
  }

  // ---------- Body ----------
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { application_id, story_score, growth_score, jury_notes } = body;

  if (!application_id || typeof application_id !== 'string') {
    return NextResponse.json({ error: 'application_id required' }, { status: 400 });
  }
  if (
    typeof story_score !== 'number' ||
    typeof growth_score !== 'number' ||
    story_score < 0 ||
    story_score > 10 ||
    growth_score < 0 ||
    growth_score > 10
  ) {
    return NextResponse.json(
      { error: 'story_score and growth_score must be numbers 0-10' },
      { status: 400 }
    );
  }

  // ---------- Upsert ----------
  const { data, error } = await supabaseAdmin
    .from('jury_scores')
    .upsert(
      {
        application_id,
        juror_id: me.id, // Always use authenticated user's id (security)
        story_score,
        growth_potential_score: growth_score,
        jury_notes: jury_notes || null,
      },
      { onConflict: 'application_id,juror_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[SCORES] Upsert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, score: data });
}
