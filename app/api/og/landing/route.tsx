// ============================================================================
// GET /api/og/landing
// Default OG image for the landing page — shown on social shares
// of awards.elev8-suite.com (without specific applicant slug)
// ============================================================================

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLORS = {
  cream: '#F8F2E8',
  navy: '#1F3A4F',
  coral: '#D4663F',
  teal: '#1F8A7A',
  burgundy: '#7A2935',
  gold: '#E8A93C',
};

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: COLORS.cream,
          padding: '70px 80px',
          position: 'relative',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            right: -120,
            bottom: -120,
            width: 500,
            height: 500,
            borderRadius: '100%',
            background: `radial-gradient(circle at 30% 30%, ${COLORS.coral}33 0%, transparent 60%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: -200,
            width: 600,
            height: 600,
            borderRadius: '100%',
            background: `radial-gradient(circle at 50% 50%, ${COLORS.gold}22 0%, transparent 60%)`,
            display: 'flex',
          }}
        />

        {/* Header bar — CHA brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 60,
            zIndex: 1,
          }}
        >
          {/* Logo: 4 colored squares */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 14, height: 28, borderRadius: 4, background: COLORS.coral }} />
              <div style={{ width: 14, height: 28, borderRadius: 4, background: COLORS.teal }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 14, height: 28, borderRadius: 4, background: COLORS.burgundy }} />
              <div style={{ width: 14, height: 28, borderRadius: 4, background: COLORS.gold }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1.5, color: COLORS.navy }}>
              CANGGU
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: '#6B6055' }}>
              HOSPITALITY ASSOCIATION
            </span>
          </div>
        </div>

        {/* Edition badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: COLORS.navy,
            color: COLORS.cream,
            padding: '10px 22px',
            borderRadius: 100,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
            alignSelf: 'flex-start',
            marginBottom: 30,
            zIndex: 1,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.gold }} />
          EDITION 01 · BALI VILLA CONNECT 2026
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'serif',
            fontSize: 96,
            lineHeight: 0.95,
            color: COLORS.navy,
            letterSpacing: -3,
            marginBottom: 40,
            zIndex: 1,
          }}
        >
          <span>The CHA</span>
          <span>
            Hospitality{' '}
            <span style={{ color: COLORS.coral, fontStyle: 'italic' }}>Awards</span>
          </span>
        </div>

        {/* Pitch */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            lineHeight: 1.4,
            color: COLORS.navy,
            opacity: 0.85,
            maxWidth: 780,
            marginBottom: 50,
            zIndex: 1,
          }}
        >
          Three winners. One stage. The most ambitious villa operators in Canggu.
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 30,
            borderTop: `1px solid rgba(31,58,79,0.15)`,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 16, color: COLORS.navy, fontWeight: 600 }}>
              Apply by 22 May
            </span>
            <span style={{ color: '#6B6055', fontSize: 16 }}>·</span>
            <span style={{ fontSize: 16, color: '#6B6055' }}>
              awards.elev8-suite.com
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: COLORS.gold,
              color: COLORS.navy,
              padding: '8px 16px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Powered by Elev8 Suite OS
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
