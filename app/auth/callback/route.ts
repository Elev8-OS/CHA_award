// ============================================================================
// GET /auth/callback?code=xxx&next=/admin
// Handles the magic-link redirect — exchanges the auth code for a session
// cookie, then redirects to the original destination.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export const dynamic = 'force-dynamic';

/**
 * Determine the public origin of this app, working correctly behind
 * reverse proxies (Railway, Vercel, etc.) where req.nextUrl.origin gives
 * the internal container origin (localhost:8080).
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL env var (most reliable)
 * 2. X-Forwarded-Host + X-Forwarded-Proto (set by Railway/proxies)
 * 3. Host header
 * 4. req.nextUrl.origin (last resort, may be wrong behind proxy)
 */
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

  const cookieStore = cookies();
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // read-only cookieStore in some contexts; ok
            }
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback exchange error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return response;
}
