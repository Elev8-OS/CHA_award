import { notFound } from 'next/navigation';
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

  // Note: We allow opening the form for both 'draft' and 'submitted' applications.
  // Submitted apps can be edited via the continue_token link (e.g., when answering
  // the AI follow-up question from the jury). The form UI shows a banner indicating
  // the application is already submitted and edits will be added to it.

  return <ApplicationFormClient initialApplication={app} />;
}
