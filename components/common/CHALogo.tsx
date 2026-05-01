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
// Recommended specs:
// - Square or near-square aspect ratio
// - At least 400x400px for PNG/JPG (will be displayed up to 380px)
// - Transparent background preferred (PNG/SVG only — JPG cannot have transparency)
// ============================================================================

'use client';

import { useState } from 'react';

interface CHALogoProps {
  className?: string;
  size?: number;
}

// Order matters: tried left-to-right, first that loads wins.
const LOGO_PATHS = ['/brand/logo.svg', '/brand/logo.png', '/brand/logo.jpg'];

export function CHALogo({ className = '', size = 40 }: CHALogoProps) {
  const [pathIndex, setPathIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // Try external logos first
  if (!showFallback && pathIndex < LOGO_PATHS.length) {
    return (
      <img
        src={LOGO_PATHS[pathIndex]}
        alt="CHA"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => {
          // Try next format; if exhausted, show inline SVG fallback
          if (pathIndex + 1 < LOGO_PATHS.length) {
            setPathIndex(pathIndex + 1);
          } else {
            setShowFallback(true);
          }
        }}
      />
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
