import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ApplicationFormClient } from '@/components/apply/ApplicationFormClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { token: string };
}

export default async function ApplyTokenPage({ params }: PageProps) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('continue_token', params.token)
    .single();

  if (error || !app) notFound();

  // Already submitted? Redirect to public page
  if (app.status !== 'draft') {
    redirect(`/v/${app.public_slug || app.id}`);
  }

  return <ApplicationFormClient initialApplication={app} />;
}
