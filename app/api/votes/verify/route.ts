// ============================================================================
// POST /api/votes/verify
// Verifies 6-digit OTP and marks vote as verified
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizePhoneNumber } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  application_id: z.string().uuid(),
  voter_whatsapp: z.string().min(8),
  otp: z.string().length(6),
});

const OTP_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { application_id, voter_whatsapp, otp } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(voter_whatsapp);

    // Find pending vote event
    const { data: voteEvent, error: findError } = await supabaseAdmin
      .from('vote_events')
      .select('id, verification_code, is_verified, created_at')
      .eq('application_id', application_id)
      .eq('voter_whatsapp', normalizedPhone)
      .single();

    if (findError || !voteEvent) {
      return NextResponse.json(
        { error: 'No verification request found. Please request a new code.' },
        { status: 404 }
      );
    }

    if (voteEvent.is_verified) {
      return NextResponse.json({ error: 'Already voted.' }, { status: 409 });
    }

    // Check OTP validity (10 min)
    const createdAt = new Date(voteEvent.created_at).getTime();
    if (Date.now() - createdAt > OTP_VALIDITY_MS) {
      return NextResponse.json(
        { error: 'Code expired. Please request a new one.' },
        { status: 410 }
      );
    }

    if (voteEvent.verification_code !== otp) {
      return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    }

    // Mark verified
    const { error: updateError } = await supabaseAdmin
      .from('vote_events')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_code: null, // burn the code
      })
      .eq('id', voteEvent.id);

    if (updateError) {
      console.error('Vote verify update failed:', updateError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Get updated vote count
    const { count } = await supabaseAdmin
      .from('vote_events')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', application_id)
      .eq('is_verified', true);

    return NextResponse.json({ success: true, vote_count: count || 0 });
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
