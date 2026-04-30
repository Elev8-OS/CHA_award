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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/admin';

  // Build absolute redirect URL using the request's origin so it works
  // behind proxies/load balancers (Railway/Vercel/etc.)
  const origin = req.nextUrl.origin;

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
            // Set on both the cookieStore (for SSR reads in this request)
            // and the NextResponse (for the client to receive)
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server component may have read-only cookieStore; that's fine
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
