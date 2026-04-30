// ============================================================================
// POST /api/votes/request-otp
// Generates 6-digit OTP and sends via WhatsApp
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendVotingOtp } from '@/lib/whatsapp/templates';
import { hashIP, normalizePhoneNumber } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  application_id: z.string().uuid(),
  voter_whatsapp: z.string().min(8),
  voter_name: z.string().max(100).optional(),
  referrer_slug: z.string().max(80).optional(),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { application_id, voter_whatsapp, voter_name, referrer_slug } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(voter_whatsapp);

    // Get applicant info for OTP message
    const { data: applicant, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, full_name, business_name, public_slug, language, is_public')
      .eq('id', application_id)
      .single();

    if (appError || !applicant || !applicant.is_public) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Check rate limit: max 5 OTP requests per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentRequests } = await supabaseAdmin
      .from('vote_events')
      .select('*', { count: 'exact', head: true })
      .eq('voter_whatsapp', normalizedPhone)
      .gte('created_at', oneHourAgo);

    if ((recentRequests || 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if already voted (verified vote exists)
    const { data: existing } = await supabaseAdmin
      .from('vote_events')
      .select('id, is_verified')
      .eq('application_id', application_id)
      .eq('voter_whatsapp', normalizedPhone)
      .maybeSingle();

    if (existing?.is_verified) {
      return NextResponse.json(
        { error: 'You have already voted for this applicant.' },
        { status: 409 }
      );
    }

    // Generate OTP
    const otp = generateOtp();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ipHash = await hashIP(ip);
    const ua = req.headers.get('user-agent') || '';

    // Don't credit a referrer if they're voting for themselves
    const refSlug =
      referrer_slug && referrer_slug !== applicant.public_slug ? referrer_slug : null;

    // Upsert vote event with new OTP (overwrites old unverified one)
    const { error: upsertError } = await supabaseAdmin
      .from('vote_events')
      .upsert(
        {
          application_id,
          voter_whatsapp: normalizedPhone,
          voter_name: voter_name || null,
          ip_hash: ipHash,
          user_agent_hash: ua.slice(0, 200),
          verification_code: otp,
          is_verified: false,
          referrer_slug: refSlug,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'application_id,voter_whatsapp' }
      );

    if (upsertError) {
      console.error('Vote upsert failed:', upsertError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Send OTP via WhatsApp
    const applicantDisplay = applicant.business_name || applicant.full_name || 'this applicant';
    const locale = (applicant.language === 'id' ? 'id' : 'en') as 'id' | 'en';

    try {
      await sendVotingOtp({
        to: normalizedPhone,
        locale,
        applicantName: applicantDisplay,
        otp,
      });
    } catch (waError: any) {
      console.error('WhatsApp send failed:', waError.message);
      // Don't expose WA error to client, but log
      return NextResponse.json(
        { error: 'Could not send verification code. Please check your number.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
