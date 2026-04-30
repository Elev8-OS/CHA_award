// ============================================================================
// POST /api/track/share
// Logs share events and increments share counter atomically
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashIP } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  application_id: z.string().uuid(),
  channel: z.enum(['whatsapp', 'linkedin', 'copy', 'instagram', 'twitter', 'other']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { application_id, channel } = parsed.data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ipHash = await hashIP(ip);

    await supabaseAdmin.from('share_events').insert({
      application_id,
      channel,
      ip_hash: ipHash,
    });

    await supabaseAdmin.rpc('increment_share_count', { app_id: application_id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
