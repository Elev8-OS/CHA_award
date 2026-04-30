// ============================================================================
// PATCH /api/admin/applications/[id]/status
// Admin-only: change status (shortlisted, finalist, winner, rejected)
// Optionally triggers WhatsApp + email notification
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendShortlistNotification,
  sendFinalistNotification,
  sendWinnerNotification,
} from '@/lib/whatsapp/templates';
import {
  sendShortlistEmail,
  sendFinalistEmail,
  sendWinnerEmail,
} from '@/lib/email/resend';
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
      .select('id, full_name, business_name, whatsapp, email, public_slug, language, category')
      .single();

    if (error || !app) {
      console.error('Status update error:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // ----- Notifications (non-blocking, fail-soft) -----
    if (notify && (status === 'shortlisted' || status === 'finalist' || status === 'winner')) {
      const locale = (app.language === 'id' ? 'id' : 'en') as 'id' | 'en';
      const applicantName = app.full_name || 'there';
      const businessName = app.business_name || 'your business';
      const category = app.category || '';
      const publicSlug = app.public_slug || app.id;

      // WhatsApp
      if (app.whatsapp) {
        const waPromise =
          status === 'shortlisted'
            ? sendShortlistNotification({
                to: app.whatsapp,
                locale,
                applicantName,
                category,
                publicSlug,
                applicationId: app.id,
              })
            : status === 'finalist'
            ? sendFinalistNotification({
                to: app.whatsapp,
                locale,
                applicantName,
                category,
                publicSlug,
                applicationId: app.id,
              })
            : sendWinnerNotification({
                to: app.whatsapp,
                locale,
                applicantName,
                category,
                publicSlug,
                applicationId: app.id,
              });

        waPromise.catch((err) => console.error(`WA notify (${status}) failed:`, err));
      }

      // Email
      if (app.email) {
        const emailPromise =
          status === 'shortlisted'
            ? sendShortlistEmail({
                to: app.email,
                locale,
                applicantName,
                businessName,
                category,
                publicSlug,
              })
            : status === 'finalist'
            ? sendFinalistEmail({
                to: app.email,
                locale,
                applicantName,
                businessName,
                category,
                publicSlug,
              })
            : sendWinnerEmail({
                to: app.email,
                locale,
                applicantName,
                businessName,
                category,
                publicSlug,
              });

        emailPromise.catch((err) => console.error(`Email notify (${status}) failed:`, err));
      }
    }

    return NextResponse.json({ success: true, status: app });
  } catch (error: any) {
    console.error('Status PATCH exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
