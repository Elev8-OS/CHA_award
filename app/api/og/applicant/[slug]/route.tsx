// ============================================================================
// GET /api/og/applicant/[slug]
// Dynamic OG image for share previews on WhatsApp / LinkedIn / X
// Uses Next.js ImageResponse (Edge Runtime)
// ============================================================================

import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORY_GRADIENTS = {
  boutique: 'linear-gradient(135deg, #D4663F 0%, #B5532F 100%)',
  growing: 'linear-gradient(135deg, #1F8A7A 0%, #176F62 100%)',
  scaled: 'linear-gradient(135deg, #7A2935 0%, #5C1F28 100%)',
};

const CATEGORY_LABELS = {
  boutique: 'BOUTIQUE · 1—3 villas',
  growing: 'GROWING · 4—9 villas',
  scaled: 'SCALED · 10+ villas',
};

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { data: applicant } = await supabaseAdmin
    .from('public_applicant_view')
    .select('*')
    .eq('public_slug', params.slug)
    .single();

  if (!applicant) {
    return new Response('Not found', { status: 404 });
  }

  const cat = (applicant.category as keyof typeof CATEGORY_GRADIENTS) || 'boutique';
  const displayName = applicant.business_name || applicant.full_name || 'Applicant';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#F8F2E8',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          {/* Mini CHA logo (4 colored squares) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '40px', gap: '2px' }}>
            <div style={{ width: '18px', height: '18px', background: '#D4663F', borderRadius: '4px' }} />
            <div style={{ width: '18px', height: '18px', background: '#1F8A7A', borderRadius: '4px' }} />
            <div style={{ width: '18px', height: '18px', background: '#7A2935', borderRadius: '4px' }} />
            <div style={{ width: '18px', height: '18px', background: '#E8A93C', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1F3A4F', letterSpacing: '0.15em' }}>
              CANGGU HOST AWARDS 2026
            </span>
            <span style={{ fontSize: '12px', color: '#6B6055', letterSpacing: '0.1em', marginTop: '4px' }}>
              EDITION 01 · PRESENTED BY CHA · POWERED BY ELEV8
            </span>
          </div>
        </div>

        {/* Body: Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flex: 1 }}>
          {applicant.hero_photo_url ? (
            <img
              src={applicant.hero_photo_url}
              alt=""
              width={200}
              height={200}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `8px solid ${cat === 'boutique' ? '#D4663F' : cat === 'growing' ? '#1F8A7A' : '#7A2935'}`,
                boxShadow: '0 20px 50px -10px rgba(31, 58, 79, 0.25)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: CATEGORY_GRADIENTS[cat],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '90px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontStyle: 'italic',
                fontFamily: 'serif',
                flexShrink: 0,
                boxShadow: '0 20px 50px -10px rgba(31, 58, 79, 0.25)',
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#D4663F',
                letterSpacing: '0.16em',
                marginBottom: '12px',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </span>
            <span
              style={{
                fontSize: '64px',
                fontFamily: 'serif',
                color: '#1F3A4F',
                lineHeight: 1.05,
                marginBottom: '12px',
              }}
            >
              {displayName.length > 30 ? displayName.slice(0, 30) + '…' : displayName}
            </span>
            {applicant.location && (
              <span style={{ fontSize: '24px', color: '#6B6055' }}>📍 {applicant.location}</span>
            )}
          </div>
        </div>

        {/* CTA Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '32px',
            borderTop: '2px solid rgba(31, 58, 79, 0.12)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7A2935', letterSpacing: '0.16em' }}>
              CAST YOUR VOTE →
            </span>
            <span style={{ fontSize: '20px', color: '#1F3A4F', marginTop: '6px', fontWeight: 600 }}>
              awards.elev8-suite.com/v/{applicant.public_slug}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#1F3A4F',
              borderRadius: '100px',
              color: '#E8A93C',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            🏆 #{applicant.category_rank || '—'} IN {cat.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
