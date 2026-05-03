// ============================================================================
// GET /api/og/applicant/[slug]
// Dynamic OG image for share previews on WhatsApp / LinkedIn / X.
//
// Uses the applicant's submitted hero photo as the FULL BACKGROUND, with a
// dark gradient overlay + minimal text on top. This is the cinematic share
// experience: each applicant's photo becomes their share preview.
//
// Falls back to category gradient if no photo uploaded.
// ============================================================================

import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORY_GRADIENTS: Record<string, string> = {
  boutique: 'linear-gradient(135deg, #D4663F 0%, #B5532F 100%)',
  growing: 'linear-gradient(135deg, #1F8A7A 0%, #176F62 100%)',
  scaled: 'linear-gradient(135deg, #7A2935 0%, #5C1F28 100%)',
};

const CATEGORY_LABELS: Record<string, string> = {
  boutique: 'BOUTIQUE · 1—3 villas',
  growing: 'GROWING · 4—9 villas',
  scaled: 'SCALED · 10+ villas',
};

const CATEGORY_COLORS: Record<string, string> = {
  boutique: '#D4663F',
  growing: '#1F8A7A',
  scaled: '#7A2935',
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

  const cat = (applicant.category as string) || 'boutique';
  const displayName = applicant.business_name || applicant.full_name || 'Applicant';
  const truncatedName = displayName.length > 32 ? displayName.slice(0, 32) + '…' : displayName;
  const accentColor = CATEGORY_COLORS[cat] || '#D4663F';

  const hasPhoto = !!applicant.hero_photo_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: hasPhoto ? '#000' : CATEGORY_GRADIENTS[cat],
        }}
      >
        {/* Background photo */}
        {hasPhoto && (
          <img
            src={applicant.hero_photo_url}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Dark gradient overlay for text legibility */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            background: hasPhoto
              ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 50%, rgba(31,58,79,0.92) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)',
            display: 'flex',
          }}
        />

        {/* Top-Left: Brand badge */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '12px 18px',
            borderRadius: '100px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Mini CHA logo (4 colored squares) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '28px',
              gap: '2px',
            }}
          >
            <div style={{ width: '13px', height: '13px', background: '#D4663F', borderRadius: '3px' }} />
            <div style={{ width: '13px', height: '13px', background: '#1F8A7A', borderRadius: '3px' }} />
            <div style={{ width: '13px', height: '13px', background: '#7A2935', borderRadius: '3px' }} />
            <div style={{ width: '13px', height: '13px', background: '#E8A93C', borderRadius: '3px' }} />
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#1F3A4F',
              letterSpacing: '0.14em',
            }}
          >
            CHA HOSPITALITY AWARDS 2026
          </span>
        </div>

        {/* Top-Right: Category rank badge */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1F3A4F',
            color: '#E8A93C',
            padding: '12px 22px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          🏆 #{applicant.category_rank || '—'} IN {cat.toUpperCase()}
        </div>

        {/* Bottom: Name + category + CTA */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '50px 60px 50px 60px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Category eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '3px',
                background: accentColor,
                display: 'flex',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.18em',
              }}
            >
              {CATEGORY_LABELS[cat] || cat.toUpperCase()}
            </span>
          </div>

          {/* Name */}
          <span
            style={{
              fontFamily: 'serif',
              fontSize: '76px',
              color: '#FFFFFF',
              lineHeight: 1,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              maxWidth: '1080px',
            }}
          >
            {truncatedName}
          </span>

          {/* CTA bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#E8A93C',
                  letterSpacing: '0.18em',
                  marginBottom: '6px',
                }}
              >
                CAST YOUR VOTE →
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                }}
              >
                awards.elev8-suite.com/v/{applicant.public_slug}
              </span>
            </div>

            {applicant.location && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                }}
              >
                📍 {applicant.location}
              </div>
            )}
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
