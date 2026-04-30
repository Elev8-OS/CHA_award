// ============================================================================
// /admin/finalists
// Select Top 5 per category, mark as finalists, bulk-notify
// ============================================================================

import { supabaseAdmin } from '@/lib/supabase/admin';
import { FinalistsManager } from '@/components/admin/FinalistsManager';

export const dynamic = 'force-dynamic';

export default async function AdminFinalistsPage() {
  // Get all submitted/shortlisted/finalist applications with vote counts
  const { data: applications } = await supabaseAdmin
    .from('public_applicant_view')
    .select('*')
    .order('vote_count', { ascending: false });

  // Get jury aggregates for sorting/filtering
  const { data: scoreSummary } = await supabaseAdmin
    .from('application_scores_summary')
    .select('*');

  // Merge
  const enriched = (applications || []).map((a) => {
    const score = scoreSummary?.find((s) => s.application_id === a.id);
    return {
      ...a,
      jury_weighted_score: score?.jury_weighted_score || null,
      juror_count: score?.juror_count || 0,
    };
  });

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="mb-2 font-serif text-3xl text-navy">Finalist Selection</h1>
      <p className="mb-8 text-sm text-warm-gray">
        Mark Top 5 per category as finalists. Bulk-notify via WhatsApp template after selection.
      </p>
      <FinalistsManager initialApplications={enriched} />
    </div>
  );
}
