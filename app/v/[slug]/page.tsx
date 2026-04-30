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

  const title = `Vote for ${applicant.business_name || applicant.full_name} — CHA Host Awards 2026`;
  const description =
    applicant.short_pitch ||
    `${applicant.business_name} is competing in the ${applicant.category} category of the CHA Hospitality Awards 2026. Cast your vote now.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og/applicant/${params.slug}`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/applicant/${params.slug}`],
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
