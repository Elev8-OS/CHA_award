import { supabaseAdmin } from '@/lib/supabase/admin';
import { categoryColors } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminJuryPage() {
  const { data: applications } = await supabaseAdmin
    .from('applications')
    .select('id, business_name, full_name, category, public_slug')
    .eq('status', 'submitted');

  const { data: scores } = await supabaseAdmin
    .from('jury_scores')
    .select('application_id, juror_id, story_score, growth_potential_score');

  const { data: jurors } = await supabaseAdmin
    .from('admin_users')
    .select('id, full_name, organization, jury_seat_color')
    .in('role', ['jury', 'admin'])
    .eq('is_active', true);

  // DEBUG: Log raw data to Railway so we can verify in production
  console.log(`[JURY-PAGE] Loaded: ${applications?.length || 0} applications, ${scores?.length || 0} scores, ${jurors?.length || 0} jurors`);
  if (scores && scores.length > 0) {
    console.log('[JURY-PAGE] First score:', JSON.stringify(scores[0]));
  }

  // Build progress matrix: per juror, count of scored applications
  const progress: Record<string, { name: string; scored: number; total: number; color: string | null }> = {};
  jurors?.forEach((j) => {
    progress[j.id] = {
      name: j.full_name,
      scored: 0,
      total: applications?.length || 0,
      color: j.jury_seat_color,
    };
  });
  scores?.forEach((s) => {
    if (progress[s.juror_id] && s.story_score !== null && s.growth_potential_score !== null) {
      progress[s.juror_id].scored++;
    }
  });

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="mb-2 font-serif text-3xl text-navy">Jury Scoring</h1>
      <p className="mb-8 text-sm text-warm-gray">
        Track scoring progress across the jury. Each juror sees applications independently.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(progress).map(([id, p]) => {
          const pct = p.total > 0 ? Math.round((p.scored / p.total) * 100) : 0;
          const colorMap: Record<string, string> = {
            coral: 'bg-coral',
            teal: 'bg-teal',
            burgundy: 'bg-burgundy',
            gold: 'bg-gold',
          };
          return (
            <div key={id} className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${colorMap[p.color || 'coral'] || 'bg-warm-gray'}`}
                />
                <div className="text-sm font-bold text-navy">{p.name}</div>
              </div>
              <div className="mb-2 font-serif text-2xl text-navy">
                {p.scored}/{p.total}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-cream">
                <div
                  className={colorMap[p.color || 'coral']}
                  style={{ width: `${pct}%`, height: '100%' }}
                />
              </div>
              <div className="mt-1 text-[11px] font-mono text-warm-gray">{pct}% done</div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/50">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-center">Story (avg)</th>
              <th className="px-5 py-3 text-center">Growth (avg)</th>
              <th className="px-5 py-3 text-center">Weighted</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {applications?.map((a) => {
              const appScores = scores?.filter((s) => s.application_id === a.id) || [];
              const completeScores = appScores.filter(
                (s) => s.story_score !== null && s.growth_potential_score !== null
              );
              const avgStory =
                completeScores.length > 0
                  ? completeScores.reduce((sum, s) => sum + (s.story_score || 0), 0) /
                    completeScores.length
                  : null;
              const avgGrowth =
                completeScores.length > 0
                  ? completeScores.reduce((sum, s) => sum + (s.growth_potential_score || 0), 0) /
                    completeScores.length
                  : null;
              const weighted =
                avgStory !== null && avgGrowth !== null ? avgStory * 0.5 + avgGrowth * 0.3 : null;
              const cat = a.category || 'boutique';
              const colors = categoryColors[cat as keyof typeof categoryColors];

              return (
                <tr key={a.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-navy">{a.business_name}</div>
                    <div className="text-xs text-warm-gray">{a.full_name}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}
                    >
                      {cat}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-sm">
                    {avgStory?.toFixed(1) || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-sm">
                    {avgGrowth?.toFixed(1) || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-sm font-bold text-navy">
                    {weighted?.toFixed(2) || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/v/${a.public_slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-warm-gray hover:text-navy"
                        title="View public page"
                      >
                        🔗 Public
                      </Link>
                      <Link
                        href={`/admin/applications/${a.id}`}
                        className="text-xs font-bold text-coral hover:text-burgundy"
                      >
                        Score →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
