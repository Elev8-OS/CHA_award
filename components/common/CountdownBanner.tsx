'use client';

import { useEffect, useState } from 'react';

interface CountdownBannerProps {
  deadline?: string; // ISO timestamp
  showThresholdHours?: number; // when to start showing
}

const DEFAULT_DEADLINE = process.env.NEXT_PUBLIC_APPLICATIONS_CLOSE_AT || '2026-05-22T23:59:59+08:00';

export function CountdownBanner({
  deadline = DEFAULT_DEADLINE,
  showThresholdHours = 48,
}: CountdownBannerProps) {
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);

    try {
      const stored = sessionStorage.getItem('cha-countdown-dismissed');
      if (stored === 'true') setDismissed(true);
    } catch {}

    return () => clearInterval(t);
  }, []);

  if (now === null || dismissed) return null;

  const target = new Date(deadline).getTime();
  const diff = target - now;

  // Don't show if too far away or already past
  if (diff <= 0 || diff > showThresholdHours * 60 * 60 * 1000) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const urgent = diff < 6 * 60 * 60 * 1000; // <6h

  const dismiss = () => {
    try {
      sessionStorage.setItem('cha-countdown-dismissed', 'true');
    } catch {}
    setDismissed(true);
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-[640px] items-center gap-3 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md md:left-auto md:right-4 ${
        urgent ? 'bg-burgundy text-white' : 'bg-navy text-cream'
      }`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${urgent ? 'bg-white/20' : 'bg-gold/20'}`}>
        <span className={`text-lg ${urgent ? '' : 'animate-pulse'}`}>
          {urgent ? '🔥' : '⏰'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">
          {urgent ? 'Submissions close very soon' : 'Submissions closing'}
        </div>
        <div className="font-mono text-base font-bold">
          {hours.toString().padStart(2, '0')}:
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
          <span className="ml-2 text-[10px] font-normal opacity-75">until 22 May 23:59 WITA</span>
        </div>
      </div>
      <a
        href="/apply"
        className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-transform hover:-translate-y-0.5 ${
          urgent ? 'bg-white text-burgundy' : 'bg-gold text-navy'
        }`}
      >
        Apply
      </a>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-lg opacity-50 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
