'use client';

import { useState, useEffect, Suspense } from 'react';
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
  const urlError = params.get('error');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ---------- Step 1: Send OTP ----------
  const sendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only existing admin_users can sign in
        },
      });
      if (error) throw error;
      setStep('code');
      setResendCooldown(60); // 60s cooldown before resend
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Step 2: Verify OTP ----------
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrorMsg('Code must be 6 digits');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) throw error;
      // Hard redirect so server reads new auth cookie
      window.location.href = '/admin';
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid or expired code');
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
            <p className="mt-2 text-sm text-warm-gray">
              CHA Hospitality Awards 2026 — Jury &amp; Admin only
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-8">
            {urlError === 'unauthorized' && (
              <div className="mb-5 rounded-lg bg-burgundy/10 p-3 text-sm text-burgundy">
                Your email is not authorized. Contact admin.
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={sendCode}>
                <label className="mb-1.5 block text-xs font-bold text-navy">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@elev8-suite.com"
                  autoFocus
                  className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-sm focus:border-coral focus:outline-none"
                />
                {errorMsg && (
                  <p className="mt-2 text-xs text-burgundy">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="mt-4 w-full rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
                >
                  {loading ? 'Sending code...' : 'Send code →'}
                </button>
                <p className="mt-4 text-center text-[11px] text-warm-gray">
                  We&apos;ll email you a 6-digit code to sign in.
                </p>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={verifyCode}>
                <div className="mb-5 text-center">
                  <div className="mb-2 text-2xl">📧</div>
                  <h2 className="mb-1 font-serif text-xl text-navy">
                    Check your email
                  </h2>
                  <p className="text-sm text-warm-gray">
                    We sent a 6-digit code to{' '}
                    <strong className="text-navy">{email}</strong>
                  </p>
                </div>

                <label className="mb-1.5 block text-xs font-bold text-navy">
                  Enter code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  autoFocus
                  className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] focus:border-coral focus:outline-none"
                />
                {errorMsg && (
                  <p className="mt-2 text-xs text-burgundy">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="mt-4 w-full rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Sign in →'}
                </button>

                <div className="mt-5 flex items-center justify-between text-[11px] text-warm-gray">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setErrorMsg('');
                    }}
                    className="underline hover:text-navy"
                  >
                    ← Use different email
                  </button>

                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendCode()}
                      disabled={loading}
                      className="underline hover:text-navy"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
