// ============================================================================
// POST /api/applications/[id]/submit
// Finalizes application: status -> submitted, generates slug,
// sends confirmation email + WhatsApp in applicant's chosen language
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendApplicationConfirmationEmail } from '@/lib/email/resend';
import { sendApplicationConfirmation } from '@/lib/whatsapp/templates';
import { z } from 'zod';

const submitSchema = z.object({
  continue_token: z.string().min(20),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Fetch application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', params.id)
      .eq('continue_token', parsed.data.continue_token)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (app.status !== 'draft') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
    }

    // Validate required fields
    const required = ['full_name', 'business_name', 'email', 'whatsapp', 'villa_count'] as const;
    const missing = required.filter((f) => !app[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Update status — trigger will auto-generate public_slug + set is_public
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: now,
      })
      .eq('id', params.id)
      .select('id, public_slug, full_name, business_name, email, whatsapp, language')
      .single();

    if (updateError || !updated) {
      console.error('Submit update error:', updateError);
      return NextResponse.json({ error: 'Submit failed' }, { status: 500 });
    }

    const locale = (updated.language === 'id' ? 'id' : 'en') as 'id' | 'en';
    const applicantName = updated.full_name || 'there';
    const businessName = updated.business_name || 'your business';

    // Send email confirmation (non-blocking; log errors but don't fail submit)
    if (updated.email) {
      sendApplicationConfirmationEmail({
        to: updated.email,
        locale,
        applicantName,
        businessName,
        publicSlug: updated.public_slug || updated.id,
      }).catch((err) => console.error('Email send failed:', err));
    }

    // Send WhatsApp confirmation (non-blocking)
    if (updated.whatsapp) {
      sendApplicationConfirmation({
        to: updated.whatsapp,
        locale,
        applicantName,
        publicSlug: updated.public_slug || updated.id,
        applicationId: updated.id,
      }).catch((err) => console.error('WA send failed:', err));
    }

    return NextResponse.json({
      success: true,
      public_slug: updated.public_slug,
      public_url: `/v/${updated.public_slug}`,
    });
  } catch (error: any) {
    console.error('Submit exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
