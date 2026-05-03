// ============================================================================
// /v/[slug] — Public applicant page
// Mobile-optimized, shareable, voting-enabled
// ============================================================================

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ApplicantPageClient } from '@/components/vote/ApplicantPageClient';
import { CHALogo } from '@/components/common/CHALogo';

interface PageProps {
  params: { slug: string };
}

// Fetch applicant data
async function getApplicant(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('public_applicant_view')
    .select('*')
    .eq('public_slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

// Generate dynamic OG metadata for share previews
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const applicant = await getApplicant(params.slug);
  if (!applicant) return { title: 'Not found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awards.elev8-suite.com';
  const ogImageUrl = `${siteUrl}/api/og/applicant/${params.slug}`;
  const pageUrl = `${siteUrl}/v/${params.slug}`;

  const displayName = applicant.business_name || applicant.full_name || 'this applicant';
  const title = `Vote for ${displayName} — CHA Hospitality Awards 2026`;
  const description =
    applicant.short_pitch ||
    `${displayName} is competing in the ${applicant.category} category of the CHA Hospitality Awards 2026. Cast your vote now.`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'CHA Hospitality Awards',
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          alt: displayName,
          type: 'image/png',
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      // WhatsApp specifically looks at these meta tags
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default async function ApplicantPage({ params }: PageProps) {
  const applicant = await getApplicant(params.slug);
  if (!applicant) notFound();

  // Track page view (server-side, doesn't block render)
  await supabaseAdmin.rpc('increment_view_count', { app_id: applicant.id });

  return (
    <main className="min-h-screen bg-cream">
      <ApplicantPageClient applicant={applicant} />
    </main>
  );
}
