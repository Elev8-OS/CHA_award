// ============================================================================
// POST /api/admin/whatsapp/send
// Admin-only endpoint to send free-form WhatsApp messages
// (only valid within 24h customer service window)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendText } from '@/lib/whatsapp/client';
import { z } from 'zod';

const schema = z.object({
  to: z.string().min(8),
  body: z.string().min(1).max(4096),
  application_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify admin auth
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('email', user.email!)
      .single();

    if (!admin || !admin.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const result = await sendText({
      to: parsed.data.to,
      body: parsed.data.body,
      applicationId: parsed.data.application_id,
      sentByAdminId: admin.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin WA send error:', error);
    return NextResponse.json({ error: error.message || 'Send failed' }, { status: 500 });
  }
}
