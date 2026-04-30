import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { categoryColors, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const { data: applications } = await supabaseAdmin
    .from('applications')
    .select('id, public_slug, full_name, business_name, email, location, category, status, mode, language, villa_count, view_count, share_count, submitted_at, created_at')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false });

  // Get vote counts per application
  const { data: voteCounts } = await supabaseAdmin
    .from('vote_events')
    .select('application_id')
    .eq('is_verified', true);

  const voteMap = new Map<string, number>();
  voteCounts?.forEach((v) => {
    voteMap.set(v.application_id, (voteMap.get(v.application_id) || 0) + 1);
  });

  const stats = {
    total: applications?.length || 0,
    boutique: applications?.filter((a) => a.category === 'boutique').length || 0,
    growing: applications?.filter((a) => a.category === 'growing').length || 0,
    scaled: applications?.filter((a) => a.category === 'scaled').length || 0,
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-navy">Applications</h1>
          <p className="mt-1 text-sm text-warm-gray">
            {stats.total} submitted · Boutique {stats.boutique} · Growing {stats.growing} · Scaled {stats.scaled}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/50">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3 text-right">Votes</th>
              <th className="px-5 py-3 text-right">Views</th>
              <th className="px-5 py-3 text-right">Shares</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {applications?.map((a) => {
              const cat = a.category || 'boutique';
              const colors = categoryColors[cat as keyof typeof categoryColors];
              return (
                <tr key={a.id} className="border-b border-line last:border-b-0 hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-navy">{a.business_name}</div>
                    <div className="text-xs text-warm-gray">{a.full_name} · {a.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}
                    >
                      {cat}
                    </span>
                    <div className="mt-1 text-xs text-warm-gray">{a.villa_count} villas</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-navy">{a.location || '—'}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm font-bold text-navy">
                    {voteMap.get(a.id) || 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-warm-gray">
                    {a.view_count || 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-warm-gray">
                    {a.share_count || 0}
                  </td>
                  <td className="px-5 py-4 text-xs text-warm-gray">
                    {a.submitted_at ? formatDate(a.submitted_at) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="text-xs font-bold text-coral hover:text-burgundy"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!applications || applications.length === 0) && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-warm-gray">
                  No submitted applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
