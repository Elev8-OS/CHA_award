// ============================================================================
// POST /api/applications/[id]/submit
// Finalizes application: status -> submitted, generates slug,
// sends confirmation email + WhatsApp in applicant's chosen language
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendApplicationConfirmationEmail,
  sendAdminNotificationEmail,
} from '@/lib/email/resend';
import { sendApplicationConfirmation } from '@/lib/whatsapp/templates';
import { generateApplicationAssessment } from '@/lib/ai/assessment';
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

    // Already submitted? Allow as no-op for follow-up edits (returning success
    // so the form thank-you flow still works) but skip the full re-trigger.
    if (app.status === 'submitted') {
      return NextResponse.json({
        success: true,
        already_submitted: true,
        public_slug: app.public_slug,
        public_url: `/v/${app.public_slug}`,
      });
    }

    if (app.status !== 'draft') {
      return NextResponse.json({ error: 'Application is locked' }, { status: 409 });
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
      .select(
        'id, public_slug, full_name, business_name, email, whatsapp, language, mode, category, location, villa_count, years_hosting, team_size, occupancy_pct, channels, short_pitch, current_tools, current_tools_pros, current_tools_cons, biggest_headache, first_attack, twelve_month_vision, why_you'
      )
      .single();

    if (updateError || !updated) {
      console.error('Submit update error:', updateError);
      return NextResponse.json({ error: 'Submit failed' }, { status: 500 });
    }

    const locale = (updated.language === 'id' ? 'id' : 'en') as 'id' | 'en';
    const applicantName = updated.full_name || 'there';
    const businessName = updated.business_name || 'your business';

    // Send email confirmation to applicant (non-blocking)
    if (updated.email) {
      sendApplicationConfirmationEmail({
        to: updated.email,
        locale,
        applicantName,
        businessName,
        publicSlug: updated.public_slug || updated.id,
      }).catch((err) => console.error('Email send failed:', err));
    }

    // Send WhatsApp confirmation to applicant (non-blocking)
    if (updated.whatsapp) {
      sendApplicationConfirmation({
        to: updated.whatsapp,
        locale,
        applicantName,
        publicSlug: updated.public_slug || updated.id,
        applicationId: updated.id,
      }).catch((err) => console.error('WA send failed:', err));
    }

    // Generate AI assessment + send admin notification (non-blocking, sequential)
    // We await the assessment so the email includes it; this adds ~2-5s
    // but happens after the response is being prepared, so user already gets thank-you redirect.
    (async () => {
      try {
        const assessment = await generateApplicationAssessment({
          business_name: businessName,
          full_name: applicantName,
          category: updated.category || 'unknown',
          location: updated.location,
          villa_count: updated.villa_count,
          years_hosting: updated.years_hosting,
          team_size: updated.team_size,
          occupancy_pct: updated.occupancy_pct,
          channels: updated.channels || [],
          short_pitch: updated.short_pitch,
          current_tools: updated.current_tools,
          current_tools_pros: updated.current_tools_pros,
          current_tools_cons: updated.current_tools_cons,
          biggest_headache: updated.biggest_headache,
          first_attack: updated.first_attack,
          twelve_month_vision: updated.twelve_month_vision,
          why_you: updated.why_you,
          mode: updated.mode || 'quick',
          language: updated.language || 'en',
        });

        await sendAdminNotificationEmail({
          applicantName,
          businessName,
          email: updated.email || '—',
          whatsapp: updated.whatsapp,
          category: updated.category || 'unknown',
          location: updated.location,
          villaCount: updated.villa_count,
          yearsHosting: updated.years_hosting,
          mode: updated.mode || 'quick',
          language: updated.language || 'en',
          publicSlug: updated.public_slug || updated.id,
          applicationId: updated.id,
          shortPitch: updated.short_pitch,
          assessment,
        });

        // ----- Follow-up trigger: schedule for 30 min later if score < 7 -----
        if (assessment && assessment.followup_questions.length > 0) {
          const minScore = Math.min(assessment.story_score, assessment.growth_score);

          if (minScore < 7) {
            // Get continue_token + check if followup was already scheduled/sent
            const { data: appCheck } = await supabaseAdmin
              .from('applications')
              .select('continue_token, followup_sent_at, followup_scheduled_at, whatsapp')
              .eq('id', updated.id)
              .single();

            // Only schedule if not already scheduled AND not already sent
            if (
              appCheck &&
              !appCheck.followup_sent_at &&
              !appCheck.followup_scheduled_at &&
              appCheck.whatsapp
            ) {
              const sendAt = new Date(Date.now() + 30 * 60 * 1000); // +30 min

              await supabaseAdmin
                .from('applications')
                .update({
                  followup_questions: assessment.followup_questions,
                  followup_scheduled_at: sendAt.toISOString(),
                })
                .eq('id', updated.id);

              console.log(
                `Follow-up scheduled for ${sendAt.toISOString()} — ${assessment.followup_questions[0].field} (scores ${assessment.story_score}/${assessment.growth_score})`
              );
            }
          }
        }
      } catch (err) {
        console.error('Admin notification flow failed:', err);
      }
    })();

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
