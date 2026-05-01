// ============================================================================
// CHA Logo — smart loader with multi-format support
//
// HOW TO REPLACE WITH YOUR LOGO:
// Drop ANY of these files in public/brand/ — first match wins:
//   1. logo.svg  ← preferred (scales crisply, smallest filesize)
//   2. logo.png  ← good for raster logos with transparent background
//   3. logo.jpg  ← OK for photographic logos
//
// No code changes needed. Component tries each format in order, falls back
// to inline SVG (4-heart fallback) if none found.
//
// FINE-TUNING:
// If your logo has whitespace/padding around the content (very common!),
// adjust LOGO_SCALE below. Examples:
//   LOGO_SCALE = 1.0  ← logo fills the file edge to edge (default)
//   LOGO_SCALE = 1.3  ← small bit of padding in the file
//   LOGO_SCALE = 1.6  ← lots of padding (typical exported logos)
//   LOGO_SCALE = 2.0  ← logo is tiny in the center of huge file
// ============================================================================

'use client';

import { useState } from 'react';

interface CHALogoProps {
  className?: string;
  size?: number;
}

// Order matters: tried left-to-right, first that loads wins.
const LOGO_PATHS = ['/brand/logo.svg', '/brand/logo.png', '/brand/logo.jpg'];

// Scale factor — bumps logo display size if your file has whitespace padding.
// 1.0 = file is tightly cropped. 1.5 = bit of padding. 2.0 = lots of padding.
const LOGO_SCALE = 1.5;

export function CHALogo({ className = '', size = 40 }: CHALogoProps) {
  const [pathIndex, setPathIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // Try external logos first
  if (!showFallback && pathIndex < LOGO_PATHS.length) {
    const renderSize = Math.round(size * LOGO_SCALE);
    return (
      // Container keeps the layout slot at `size`, but the inner img scales up
      // by LOGO_SCALE and overflows visually — this avoids breaking adjacent
      // elements while making the logo look bigger.
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        <img
          src={LOGO_PATHS[pathIndex]}
          alt="CHA"
          width={renderSize}
          height={renderSize}
          style={{ width: renderSize, height: renderSize, objectFit: 'contain' }}
          onError={() => {
            if (pathIndex + 1 < LOGO_PATHS.length) {
              setPathIndex(pathIndex + 1);
            } else {
              setShowFallback(true);
            }
          }}
        />
      </span>
    );
  }

  // Fallback: inline SVG (4 colored heart-pills)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coral heart top-left */}
      <path
        d="M22 20 Q22 12 30 12 Q38 12 42 20 L42 42 Q42 46 38 46 L26 46 Q22 46 22 42 Z M30 24 Q30 30 36 32 Q34 28 30 24"
        fill="#D4663F"
      />
      {/* Teal heart top-right */}
      <path
        d="M58 20 Q58 12 66 12 Q74 12 78 20 L78 42 Q78 46 74 46 L62 46 Q58 46 58 42 Z M66 24 Q66 30 72 32 Q70 28 66 24"
        fill="#1F8A7A"
      />
      {/* Burgundy heart bottom-left */}
      <path
        d="M22 56 Q22 50 28 50 L40 50 Q42 50 42 54 L42 78 Q42 86 34 86 Q26 86 22 78 Z M30 64 Q30 70 36 72 Q34 68 30 64"
        fill="#7A2935"
      />
      {/* Gold heart bottom-right */}
      <path
        d="M58 56 Q58 50 64 50 L76 50 Q78 50 78 54 L78 78 Q78 86 70 86 Q62 86 58 78 Z M66 64 Q66 70 72 72 Q70 68 66 64"
        fill="#E8A93C"
      />
    </svg>
  );
}
