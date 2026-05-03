// ============================================================================
// CHA Logo — smart loader with multi-format support
//
// HOW TO REPLACE WITH YOUR LOGO:
// Drop ANY of these files in public/brand/ — first match wins:
//   1. logo.png  ← preferred for raster logos with transparent background
//   2. logo.svg  ← if you have a vector logo (smallest, scales crisply)
//   3. logo.jpg  ← OK for photographic logos
//
// No code changes needed. Component tries each format in order, falls back
// to inline SVG (4-heart fallback) if none found.
// ============================================================================

'use client';

import { useState, useEffect } from 'react';

interface CHALogoProps {
  className?: string;
  size?: number;
}

// Order matters: tried left-to-right, first that loads wins.
// PNG first because most users will have raster logos.
const LOGO_PATHS = ['/brand/logo.png', '/brand/logo.svg', '/brand/logo.jpg'];

export function CHALogo({ className = '', size = 40 }: CHALogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // On mount: try each logo path until one loads
  useEffect(() => {
    let cancelled = false;

    async function findLogo() {
      for (const path of LOGO_PATHS) {
        const exists = await checkImageExists(path);
        if (cancelled) return;
        if (exists) {
          setLogoUrl(path);
          setLoaded(true);
          return;
        }
      }
      // Nothing found — show inline SVG fallback
      if (!cancelled) {
        setLoaded(true);
      }
    }

    findLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  // While loading: show inline SVG fallback (so layout doesn't shift)
  if (!loaded || !logoUrl) {
    if (loaded && !logoUrl) {
      // Confirmed: no external logo, show fallback permanently
      return <InlineFallback size={size} className={className} />;
    }
    // Still loading: show fallback temporarily
    return <InlineFallback size={size} className={className} />;
  }

  // Found an external logo
  return (
    <img
      src={logoUrl}
      alt="CHA"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

// Helper: check if image exists by attempting to load it
function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Inline 4-heart SVG fallback
function InlineFallback({ size, className }: { size: number; className: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 20 Q22 12 30 12 Q38 12 42 20 L42 42 Q42 46 38 46 L26 46 Q22 46 22 42 Z M30 24 Q30 30 36 32 Q34 28 30 24"
        fill="#D4663F"
      />
      <path
        d="M58 20 Q58 12 66 12 Q74 12 78 20 L78 42 Q78 46 74 46 L62 46 Q58 46 58 42 Z M66 24 Q66 30 72 32 Q70 28 66 24"
        fill="#1F8A7A"
      />
      <path
        d="M22 56 Q22 50 28 50 L40 50 Q42 50 42 54 L42 78 Q42 86 34 86 Q26 86 22 78 Z M30 64 Q30 70 36 72 Q34 68 30 64"
        fill="#7A2935"
      />
      <path
        d="M58 56 Q58 50 64 50 L76 50 Q78 50 78 54 L78 78 Q78 86 70 86 Q62 86 58 78 Z M66 64 Q66 70 72 72 Q70 68 66 64"
        fill="#E8A93C"
      />
    </svg>
  );
}
