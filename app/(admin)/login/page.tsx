'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CHALogo } from '@/components/common/CHALogo';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const error = params.get('error');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = getSupabaseBrowser();
      // Build callback URL: /auth/callback?next=/admin
      // The callback route exchanges the code for a session cookie, then
      // redirects to ?next= destination.
      const redirectUrl = new URL('/auth/callback', window.location.origin);
      redirectUrl.searchParams.set('next', '/admin');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl.toString() },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <section className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-5 inline-block">
              <CHALogo size={64} />
            </div>
            <h1 className="font-serif text-3xl text-navy">Admin sign in</h1>
            <p className="mt-2 text-sm text-warm-gray">CHA Hospitality Awards 2026 — Jury & Admin only</p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-8">
            {error === 'unauthorized' && (
              <div className="mb-5 rounded-lg bg-burgundy/10 p-3 text-sm text-burgundy">
                Your email is not authorized. Contact admin.
              </div>
            )}

            {sent ? (
              <div className="text-center">
                <div className="mb-3 text-3xl">📧</div>
                <h2 className="mb-2 font-serif text-xl text-navy">Check your email</h2>
                <p className="text-sm text-warm-gray">
                  We sent a magic sign-in link to <strong>{email}</strong>. Click the link to enter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <label className="mb-1.5 block text-xs font-bold text-navy">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@elev8-suite.com"
                  className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-sm focus:border-coral focus:outline-none"
                />
                {errorMsg && (
                  <p className="mt-2 text-xs text-burgundy">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send magic link →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
