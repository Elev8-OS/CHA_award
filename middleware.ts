import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  // Only protect admin routes
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow login page
  if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth check uses TWO paths (either grants access):
  //   1. User exists in admin_users with is_active=true (preferred, dynamic)
  //   2. User email is in ADMIN_ALLOWED_EMAILS env var (legacy fallback)

  let isAuthorized = false;

  // Path 1: admin_users table check
  // Uses SERVICE ROLE client to bypass RLS (admin_users RLS policy is
  // self-referential and doesn't work for the user themselves checking
  // their own row).
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: adminRow } = await adminClient
      .from('admin_users')
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (adminRow?.is_active) {
      isAuthorized = true;
    }
  } catch (err) {
    console.error('[middleware] admin_users check failed:', err);
    // Fall through to env var check
  }

  // Path 2: env var allowlist (legacy fallback)
  if (!isAuthorized) {
    const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (
      allowedEmails.length > 0 &&
      allowedEmails.includes(user.email?.toLowerCase() || '')
    ) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
