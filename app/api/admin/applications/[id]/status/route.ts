// ============================================================================
// PATCH /api/admin/applications/[id]/status
// Admin-only: change status (shortlisted, finalist, winner, rejected)
// Optionally triggers WhatsApp + email notification
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendFinalistNotification } from '@/lib/whatsapp/templates';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['submitted', 'shortlisted', 'finalist', 'winner', 'rejected']),
  notify: z.boolean().default(false),
});

async function verifyAdmin() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active')
    .eq('email', user.email!)
    .single();
  if (!admin || !admin.is_active || admin.role === 'viewer') return null;
  return admin;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { status, notify } = parsed.data;

    // Build update payload
    const update: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === 'shortlisted') update.shortlisted_at = now;
    if (status === 'finalist') update.finalist_at = now;
    if (status === 'winner') update.winner_at = now;

    const { data: app, error } = await supabaseAdmin
      .from('applications')
      .update(update)
      .eq('id', params.id)
      .select('id, full_name, business_name, whatsapp, public_slug, language, category')
      .single();

    if (error || !app) {
      console.error('Status update error:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Optional: notify applicant
    if (notify && app.whatsapp && status === 'finalist') {
      const locale = (app.language === 'id' ? 'id' : 'en') as 'id' | 'en';
      sendFinalistNotification({
        to: app.whatsapp,
        locale,
        applicantName: app.full_name || 'there',
        category: app.category || '',
        publicSlug: app.public_slug || app.id,
        applicationId: app.id,
      }).catch((err) => console.error('Notify failed:', err));
    }

    return NextResponse.json({ success: true, status: app });
  } catch (error: any) {
    console.error('Status PATCH exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
