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
  openGraph: {
    title: 'The CHA Hospitality Awards 2026',
    description:
      'Presented by the Canggu Hospitality Association, powered by Elev8 Suite OS.',
    url: '/',
    siteName: 'CHA Host Awards',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The CHA Hospitality Awards 2026',
    description:
      'Presented by the Canggu Hospitality Association, powered by Elev8 Suite OS.',
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
