// ============================================================================
// /admin/analytics
// Live funnel + top applicants + share/view stats
// ============================================================================

import { supabaseAdmin } from '@/lib/supabase/admin';
import { categoryColors } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  // Funnel stats
  const { count: drafts } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  const { count: submitted } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'draft');

  const { count: votesTotal } = await supabaseAdmin
    .from('vote_events')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  const { count: viewsTotal } = await supabaseAdmin
    .from('page_views')
    .select('*', { count: 'exact', head: true });

  const { count: sharesTotal } = await supabaseAdmin
    .from('share_events')
    .select('*', { count: 'exact', head: true });

  // Top performers by votes
  const { data: topByVotes } = await supabaseAdmin
    .from('public_applicant_view')
    .select('public_slug, business_name, full_name, category, vote_count, view_count, share_count')
    .eq('is_public', true)
    .order('vote_count', { ascending: false })
    .limit(10);

  // Share breakdown by channel
  const { data: shareEvents } = await supabaseAdmin
    .from('share_events')
    .select('channel');

  const shareBreakdown: Record<string, number> = {};
  shareEvents?.forEach((s) => {
    shareBreakdown[s.channel] = (shareBreakdown[s.channel] || 0) + 1;
  });

  // Conversion: drafts that became submitted
  const totalStarted = (drafts || 0) + (submitted || 0);
  const conversionPct = totalStarted > 0 ? Math.round(((submitted || 0) / totalStarted) * 100) : 0;

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="mb-2 font-serif text-3xl text-navy">Analytics</h1>
      <p className="mb-8 text-sm text-warm-gray">
        Live funnel and engagement metrics for the CHA Hospitality Awards 2026.
      </p>

      {/* Top KPIs */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        <KPI label="Drafts" value={drafts || 0} color="warm-gray" />
        <KPI label="Submitted" value={submitted || 0} color="coral" />
        <KPI label="Conversion" value={`${conversionPct}%`} color="teal" small />
        <KPI label="Verified Votes" value={votesTotal || 0} color="burgundy" />
        <KPI label="Page Views" value={viewsTotal || 0} color="gold" />
      </div>

      {/* Top performers */}
      <div className="mb-10 rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg text-navy">Top performers</h2>
          <p className="mt-0.5 text-xs text-warm-gray">By verified vote count</p>
        </div>
        <table className="w-full">
          <thead className="border-b border-line bg-cream/40">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-warm-gray">
              <th className="px-5 py-2.5">#</th>
              <th className="px-5 py-2.5">Applicant</th>
              <th className="px-5 py-2.5">Category</th>
              <th className="px-5 py-2.5 text-right">Votes</th>
              <th className="px-5 py-2.5 text-right">Views</th>
              <th className="px-5 py-2.5 text-right">Shares</th>
              <th className="px-5 py-2.5 text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            {topByVotes?.map((a, idx) => {
              const cat = a.category || 'boutique';
              const colors = categoryColors[cat as keyof typeof categoryColors];
              const ctr = a.view_count > 0 ? ((a.vote_count / a.view_count) * 100).toFixed(1) : '—';
              return (
                <tr key={a.public_slug} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 font-mono text-sm text-warm-gray">{idx + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-navy">{a.business_name}</div>
                    <div className="text-xs text-warm-gray">{a.full_name}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}
                    >
                      {cat}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm font-bold text-navy">
                    {a.vote_count || 0}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">
                    {a.view_count || 0}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">
                    {a.share_count || 0}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">{ctr}%</td>
                </tr>
              );
            })}
            {(!topByVotes || topByVotes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-warm-gray">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Share breakdown */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-1 font-serif text-lg text-navy">Share channels</h2>
        <p className="mb-5 text-xs text-warm-gray">{sharesTotal || 0} total shares</p>
        <div className="space-y-2">
          {Object.entries(shareBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([channel, count]) => {
              const pct = (sharesTotal || 0) > 0 ? (count / (sharesTotal || 1)) * 100 : 0;
              return (
                <div key={channel} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-semibold capitalize text-navy">{channel}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-cream">
                    <div className="h-2 bg-coral" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right font-mono text-sm text-warm-gray">{count}</span>
                </div>
              );
            })}
          {Object.keys(shareBreakdown).length === 0 && (
            <p className="text-sm text-warm-gray">No shares logged yet.</p>
          )}
        </div>
      </div>

      {/* Referrer attribution */}
      <ReferrerAttributionTable />
    </div>
  );
}

async function ReferrerAttributionTable() {
  const { data: conversion } = await supabaseAdmin
    .from('share_conversion_summary')
    .select('*')
    .order('votes_driven_to_others', { ascending: false })
    .limit(15);

  const hasData = conversion && conversion.some((c) => (c.total_shares || 0) > 0);

  return (
    <div className="mt-8 rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="font-serif text-lg text-navy">Share → Vote conversion</h2>
        <p className="mt-0.5 text-xs text-warm-gray">
          Who's driving votes to others by sharing? Top advocates of the awards.
        </p>
      </div>

      {!hasData ? (
        <div className="px-5 py-12 text-center text-sm text-warm-gray">
          No share-driven votes yet. Tracking activates when applicants share their pages with{' '}
          <code className="rounded bg-cream px-1">?ref=slug</code>.
        </div>
      ) : (
        <table className="w-full">
          <thead className="border-b border-line bg-cream/40">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-warm-gray">
              <th className="px-5 py-2.5">Sharer</th>
              <th className="px-5 py-2.5 text-right">WA shares</th>
              <th className="px-5 py-2.5 text-right">LinkedIn</th>
              <th className="px-5 py-2.5 text-right">Copy</th>
              <th className="px-5 py-2.5 text-right">Total shares</th>
              <th className="px-5 py-2.5 text-right">Votes driven</th>
            </tr>
          </thead>
          <tbody>
            {conversion?.filter((c) => (c.total_shares || 0) > 0).map((c) => (
              <tr key={c.id} className="border-b border-line last:border-b-0">
                <td className="px-5 py-3">
                  <div className="font-semibold text-navy">{c.business_name}</div>
                  <div className="text-xs text-warm-gray">{c.full_name}</div>
                </td>
                <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">{c.whatsapp_shares || 0}</td>
                <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">{c.linkedin_shares || 0}</td>
                <td className="px-5 py-3 text-right font-mono text-sm text-warm-gray">{c.copy_shares || 0}</td>
                <td className="px-5 py-3 text-right font-mono text-sm font-bold text-navy">{c.total_shares || 0}</td>
                <td className="px-5 py-3 text-right font-mono text-sm font-bold text-teal">
                  +{c.votes_driven_to_others || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  const borderClass: Record<string, string> = {
    'warm-gray': 'border-t-warm-gray',
    coral: 'border-t-coral',
    teal: 'border-t-teal',
    burgundy: 'border-t-burgundy',
    gold: 'border-t-gold',
  };

  return (
    <div className={`rounded-2xl border-t-4 bg-white p-5 ${borderClass[color] || ''}`}>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-warm-gray">
        {label}
      </div>
      <div className={`font-serif leading-none tracking-tight text-navy ${small ? 'text-3xl' : 'text-4xl'}`}>
        {value}
      </div>
    </div>
  );
}
