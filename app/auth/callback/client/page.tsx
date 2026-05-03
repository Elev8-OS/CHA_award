// ============================================================================
// /auth/callback/client?code=xxx&next=/admin
//
// Client-side handler for PKCE auth flow.
// The PKCE code_verifier lives in localStorage (browser-only), so the code
// exchange has to happen here, not on the server.
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/admin';

    if (!code) {
      setError('Missing auth code in URL.');
      return;
    }

    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Code exchange failed:', exchangeError);
          setError(`Sign-in failed: ${exchangeError.message}`);
          return;
        }

        // Success — redirect to destination
        // Use window.location for hard navigation to ensure server reads new auth cookie
        window.location.href = next;
      } catch (e: any) {
        console.error('Auth callback exception:', e);
        setError(`Sign-in failed: ${e.message || 'Unknown error'}`);
      }
    })();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="mb-2 text-2xl">⚠️</div>
          <h1 className="mb-3 font-serif text-2xl text-navy">Sign-in failed</h1>
          <p className="mb-5 text-sm text-warm-gray">{error}</p>
          <a
            href="/login"
            className="inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white hover:bg-burgundy"
          >
            Try again →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
        <p className="text-sm text-warm-gray">Signing you in...</p>
      </div>
    </div>
  );
}
