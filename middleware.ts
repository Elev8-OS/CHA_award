import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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

  // Check email is in admin list
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && !allowedEmails.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
