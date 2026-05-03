// ============================================================================
// GET /auth/callback?code=xxx&next=/admin
// Handles the magic-link redirect.
//
// We redirect to a client-side page (/auth/callback/client) which has access
// to the PKCE code_verifier in localStorage. The Supabase JS SDK there will
// exchange the code for a session client-side.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getPublicOrigin(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  const host = req.headers.get('host');
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/admin';
  const origin = getPublicOrigin(req);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Forward to client-side page which will exchange the PKCE code
  const target = new URL('/auth/callback/client', origin);
  target.searchParams.set('code', code);
  target.searchParams.set('next', next);
  return NextResponse.redirect(target.toString());
}
