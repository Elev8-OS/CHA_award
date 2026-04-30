// ============================================================================
// /admin — Live Dashboard with KPIs, time-series, recent activity
// ============================================================================

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { categoryColors, formatDate } from '@/lib/utils';
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CLOSE_AT = new Date(process.env.APPLICATIONS_CLOSE_AT || '2026-05-22T23:59:59+08:00');

export default async function AdminDashboardPage() {
  // ----- Current KPIs -----
  const { count: drafts } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  const { count: submitted } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'draft');

  const { count: shortlisted } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['shortlisted', 'finalist', 'winner']);

  const { count: finalists } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['finalist', 'winner']);

  const { count: votesTotal } = await supabaseAdmin
    .from('vote_events')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  const { count: viewsTotal } = await supabaseAdmin
    .from('page_views')
    .select('*', { count: 'exact', head: true });

  // ----- Today's deltas -----
  const today = new Date().toISOString().split('T')[0];
  const { count: submittedToday } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', today + 'T00:00:00Z');

  const { count: votesToday } = await supabaseAdmin
    .from('vote_events')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true)
    .gte('verified_at', today + 'T00:00:00Z');

  // ----- Time series from snapshots -----
  const { data: snapshots } = await supabaseAdmin
    .from('daily_snapshots')
    .select('snapshot_date, total_submitted, total_votes, total_views, total_shares')
    .order('snapshot_date', { ascending: true })
    .limit(30);

  // ----- Recent activity -----
  const { data: recentApplications } = await supabaseAdmin
    .from('applications')
    .select('id, business_name, full_name, category, submitted_at, public_slug')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })
    .limit(5);

  const { data: recentVotes } = await supabaseAdmin
    .from('vote_events')
    .select('voter_name, voter_whatsapp, application_id, verified_at, applications(business_name)')
    .eq('is_verified', true)
    .order('verified_at', { ascending: false })
    .limit(8);

  // ----- Time to deadline -----
  const now = Date.now();
  const hoursLeft = Math.max(0, (CLOSE_AT.getTime() - now) / (1000 * 60 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);
  const remHours = Math.floor(hoursLeft % 24);

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-warm-gray">
            Live view · {submittedToday || 0} new today · {votesToday || 0} votes today
          </p>
        </div>
        <div className="rounded-full border border-line bg-white px-5 py-2.5 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-coral">Submissions close</div>
          <div className="font-mono text-sm font-bold text-navy">
            {hoursLeft > 0 ? `${daysLeft}d ${remHours}h` : 'CLOSED'}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KPI label="Drafts" value={drafts || 0} color="warm-gray" />
        <KPI label="Submitted" value={submitted || 0} color="coral" delta={submittedToday || 0} />
        <KPI label="Shortlisted" value={shortlisted || 0} color="teal" />
        <KPI label="Finalists" value={finalists || 0} color="burgundy" />
        <KPI label="Votes" value={votesTotal || 0} color="gold" delta={votesToday || 0} />
        <KPI label="Views" value={viewsTotal || 0} color="navy" />
      </div>

      {/* Time series chart */}
      {snapshots && snapshots.length > 0 && (
        <div className="mb-10 rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy">Last 30 days</h2>
            <span className="text-xs text-warm-gray">{snapshots.length} snapshots</span>
          </div>
          <TimeSeriesChart data={snapshots} />
        </div>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-serif text-lg text-navy">Latest applications</h2>
          </div>
          <div className="divide-y divide-line">
            {recentApplications && recentApplications.length > 0 ? (
              recentApplications.map((a) => {
                const cat = a.category || 'boutique';
                const colors = categoryColors[cat as keyof typeof categoryColors];
                return (
                  <Link
                    key={a.id}
                    href={`/admin/applications/${a.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-cream"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}
                    >
                      {cat}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold text-navy">{a.business_name}</div>
                      <div className="truncate text-xs text-warm-gray">{a.full_name}</div>
                    </div>
                    <span className="text-xs text-warm-gray">
                      {a.submitted_at ? formatDate(a.submitted_at) : '—'}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center text-sm text-warm-gray">No applications yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-serif text-lg text-navy">Latest votes</h2>
          </div>
          <div className="divide-y divide-line">
            {recentVotes && recentVotes.length > 0 ? (
              recentVotes.map((v: any) => (
                <div key={`${v.application_id}-${v.voter_whatsapp}`} className="flex items-center gap-3 px-5 py-3">
                  <div className="text-base">🗳️</div>
                  <div className="flex-1 min-w-0 text-sm">
                    <strong className="text-navy">{v.voter_name || 'Anonymous'}</strong>{' '}
                    <span className="text-warm-gray">voted for</span>{' '}
                    <strong className="text-navy">{v.applications?.business_name}</strong>
                  </div>
                  <span className="text-xs text-warm-gray">
                    {v.verified_at && new Date(v.verified_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-warm-gray">No votes yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  color,
  delta,
}: {
  label: string;
  value: number;
  color: string;
  delta?: number;
}) {
  const borderClass: Record<string, string> = {
    'warm-gray': 'border-t-warm-gray',
    coral: 'border-t-coral',
    teal: 'border-t-teal',
    burgundy: 'border-t-burgundy',
    gold: 'border-t-gold',
    navy: 'border-t-navy',
  };

  return (
    <div className={`rounded-2xl border-t-4 bg-white p-4 ${borderClass[color] || ''}`}>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-warm-gray">
        {label}
      </div>
      <div className="font-serif text-3xl leading-none tracking-tight text-navy">{value}</div>
      {delta !== undefined && delta > 0 && (
        <div className="mt-1 text-xs font-semibold text-teal">+{delta} today</div>
      )}
    </div>
  );
}
