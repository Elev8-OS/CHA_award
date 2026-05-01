import type { Metadata } from 'next';
import { Manrope, DM_Serif_Display } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The CHA Hospitality Awards 2026 — Canggu Hospitality Association',
  description:
    'Three winners. One stage. The most ambitious villa operators in Canggu get called up at Bali Villa Connect 2026, in front of the entire industry. Apply by 22 May.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com'
  ),
  // ============================================================================
  // FAVICON SETUP
  // To replace with your own favicon:
  // 1. Drop your files in public/brand/:
  //      - favicon.ico (32x32, classic format — used in browser tabs)
  //      - icon.svg   (square SVG, scales nicely on modern browsers)
  //      - apple-touch-icon.png (180x180, used when added to iPhone home screen)
  // 2. No code changes needed — Next.js will pick them up automatically.
  //
  // Browsers fall back gracefully: if .ico missing, .svg is used; if both
  // missing, no icon shows but everything still works.
  // ============================================================================
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/brand/apple-touch-icon.png',
    shortcut: '/brand/favicon.ico',
  },
  openGraph: {
    title: 'The CHA Hospitality Awards 2026',
    description:
      'Presented by the Canggu Hospitality Association, powered by Elev8 Suite OS.',
    url: '/',
    siteName: 'CHA Hospitality Awards',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og/landing',
        width: 1200,
        height: 630,
        alt: 'The CHA Hospitality Awards 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The CHA Hospitality Awards 2026',
    description:
      'Presented by the Canggu Hospitality Association, powered by Elev8 Suite OS.',
    images: ['/api/og/landing'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSerif.variable}`}
    >
      <body className="bg-cream text-navy antialiased">{children}</body>
    </html>
  );
}
