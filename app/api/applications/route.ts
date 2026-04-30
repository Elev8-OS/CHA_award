// ============================================================================
// POST   /api/applications      — create new draft (returns continue_token)
// PATCH  /api/applications      — update draft (requires continue_token)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const createSchema = z.object({
  mode: z.enum(['quick', 'deep']).default('quick'),
  language: z.enum(['en', 'id']).default('en'),
  source: z.string().optional(),
});

const updateSchema = z.object({
  continue_token: z.string().min(20).max(50),
  // Allow any of the application fields
  full_name: z.string().optional(),
  business_name: z.string().optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  location: z.string().optional(),
  attending_villa_connect: z.enum(['yes', 'no', 'maybe']).optional(),
  villa_count: z.number().int().min(0).optional(),
  years_hosting: z.number().int().min(0).optional(),
  team_size: z.number().int().min(0).optional(),
  occupancy_pct: z.number().int().min(0).max(100).optional(),
  channels: z.array(z.string()).optional(),
  current_tools: z.string().optional(),
  current_tools_pros: z.string().optional(),
  current_tools_cons: z.string().optional(),
  biggest_headache: z.string().optional(),
  first_attack: z.string().optional(),
  twelve_month_vision: z.string().optional(),
  why_you: z.string().optional(),
  short_pitch: z.string().max(280).optional(),
  hero_photo_url: z.string().url().optional().or(z.literal('')),
  video_pitch_url: z.string().url().optional().or(z.literal('')),
  willing_for_case_study: z.boolean().optional(),
  consent_to_publish_name: z.boolean().optional(),
  language: z.enum(['en', 'id']).optional(),
  mode: z.enum(['quick', 'deep']).optional(),
});

// ---------- POST: Create draft ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const ua = req.headers.get('user-agent') || null;

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        mode: parsed.data.mode,
        language: parsed.data.language,
        source: parsed.data.source || null,
        status: 'draft',
        ip_address: ip,
        user_agent: ua,
      })
      .select('id, continue_token')
      .single();

    if (error || !data) {
      console.error('App create error:', error);
      return NextResponse.json({ error: 'Could not create application' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      continue_token: data.continue_token,
    });
  } catch (error: any) {
    console.error('App create exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ---------- PATCH: Update draft ----------
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { continue_token, ...updates } = parsed.data;

    // Find by token
    const { data: existing, error: findError } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('continue_token', continue_token)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Application already submitted, cannot edit' },
        { status: 409 }
      );
    }

    // Filter out empty strings for URL fields
    const cleanUpdates: Record<string, unknown> = { ...updates };
    if (cleanUpdates.hero_photo_url === '') delete cleanUpdates.hero_photo_url;
    if (cleanUpdates.video_pitch_url === '') delete cleanUpdates.video_pitch_url;

    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(cleanUpdates)
      .eq('id', existing.id);

    if (updateError) {
      console.error('App update error:', updateError);
      return NextResponse.json({ error: 'Could not update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('App update exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ---------- GET: Fetch draft by token ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('continue_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ application: data });
}
