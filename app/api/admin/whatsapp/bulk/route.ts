// ============================================================================
// POST /api/admin/whatsapp/bulk
// Admin-only: send a WhatsApp template to multiple applicants
// Useful for: shortlist announcement, finalist notification, deadline reminder
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendApplicationConfirmation,
  sendFinalistNotification,
} from '@/lib/whatsapp/templates';
import { z } from 'zod';

const schema = z.object({
  application_ids: z.array(z.string().uuid()).min(1).max(100),
  template: z.enum(['finalist_notification', 'application_confirmation', 'custom']),
  custom_body: z.string().optional(),  // for 'custom' template (only works in 24h window)
});

export async function POST(req: NextRequest) {
  try {
    // Verify admin auth
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: admin } = await supabaseAdmin
      .from('admin_users')
      .select('id, role, is_active')
      .eq('email', user.email!)
      .single();
    if (!admin || !admin.is_active || admin.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { application_ids, template, custom_body } = parsed.data;

    // Fetch all target applications
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('id, full_name, whatsapp, public_slug, language, category')
      .in('id', application_ids);

    if (!apps || apps.length === 0) {
      return NextResponse.json({ error: 'No applications found' }, { status: 404 });
    }

    // Send to each (in parallel, but capture results)
    const results = await Promise.allSettled(
      apps.map(async (app) => {
        if (!app.whatsapp) {
          throw new Error(`No WhatsApp for ${app.id}`);
        }
        const locale = (app.language === 'id' ? 'id' : 'en') as 'id' | 'en';

        if (template === 'finalist_notification') {
          return await sendFinalistNotification({
            to: app.whatsapp,
            locale,
            applicantName: app.full_name || 'there',
            category: app.category || '',
            publicSlug: app.public_slug || app.id,
            applicationId: app.id,
          });
        }

        if (template === 'application_confirmation') {
          return await sendApplicationConfirmation({
            to: app.whatsapp,
            locale,
            applicantName: app.full_name || 'there',
            publicSlug: app.public_slug || app.id,
            applicationId: app.id,
          });
        }

        if (template === 'custom' && custom_body) {
          // Custom uses sendText from client (only works within 24h window)
          const { sendText } = await import('@/lib/whatsapp/client');
          return await sendText({
            to: app.whatsapp,
            body: custom_body,
            applicationId: app.id,
            sentByAdminId: admin.id,
          });
        }

        throw new Error('Invalid template configuration');
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason).slice(0, 200));

    return NextResponse.json({
      total: apps.length,
      succeeded,
      failed,
      errors: errors.slice(0, 10), // first 10 errors only
    });
  } catch (error: any) {
    console.error('Bulk WA send error:', error);
    return NextResponse.json({ error: error.message || 'Send failed' }, { status: 500 });
  }
}
