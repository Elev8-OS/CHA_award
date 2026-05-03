import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ScoringPanel } from '@/components/admin/ScoringPanel';
import { StatusTransition } from '@/components/admin/StatusTransition';
import { ReassessButton } from '@/components/admin/ReassessButton';
import { categoryColors, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!app) notFound();

  const { data: scores } = await supabaseAdmin
    .from('jury_scores')
    .select('*, juror:admin_users(full_name, organization, jury_seat_color)')
    .eq('application_id', params.id);

  // Resolve current admin user's ID (for ScoringPanel)
  let currentAdminId: string | null = null;
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: admin } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      currentAdminId = admin?.id || null;
    }
  } catch (err) {
    console.error('Failed to resolve admin id:', err);
  }

  const { count: voteCount } = await supabaseAdmin
    .from('vote_events')
    .select('*', { count: 'exact', head: true })
    .eq('application_id', params.id)
    .eq('is_verified', true);

  const cat = app.category || 'boutique';
  const colors = categoryColors[cat as keyof typeof categoryColors];

  return (
    <div className="px-6 py-8 md:px-10">
      <Link
        href="/admin/applications"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-warm-gray hover:text-navy"
      >
        ← Back to applications
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <span
            className={`mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}
          >
            ⬥ {cat} · {app.villa_count} villas
          </span>
          <h1 className="font-serif text-4xl leading-tight text-navy">{app.business_name}</h1>
          <p className="mt-1 text-base text-warm-gray">
            {app.full_name} · {app.location || '—'}
          </p>
          <div className="mt-2 flex gap-4 text-xs text-warm-gray">
            <span>📧 {app.email}</span>
            <span>📱 {app.whatsapp}</span>
          </div>
        </div>
        <div className="text-right">
          <Link
            href={`/v/${app.public_slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-burgundy"
          >
            🔗 View public page →
          </Link>
          <div className="mt-2 break-all font-mono text-[10px] text-warm-gray">
            awards.elev8-suite.com/v/{app.public_slug}
          </div>
          <div className="mt-3 text-xs text-warm-gray">
            <strong className="text-navy">{voteCount || 0}</strong> verified votes ·{' '}
            <strong className="text-navy">{app.view_count || 0}</strong> views ·{' '}
            <strong className="text-navy">{app.share_count || 0}</strong> shares
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Story column */}
        <div className="space-y-5 lg:col-span-2">
          <Section title="Application Mode" body={`${app.mode === 'deep' ? 'Deep Story' : 'Quick Apply'} · ${app.language === 'id' ? 'Bahasa Indonesia' : 'English'}`} />

          {app.short_pitch && <Section title="Short Pitch" body={app.short_pitch} italic />}

          {app.biggest_headache && (
            <Section title="Biggest headache" body={app.biggest_headache} />
          )}
          {app.first_attack && <Section title="First attack with Elev8 Suite OS" body={app.first_attack} />}
          {app.twelve_month_vision && (
            <Section title="12-month vision" body={app.twelve_month_vision} />
          )}
          {app.why_you && <Section title="Why them?" body={app.why_you} />}
          {app.current_tools && <Section title="Current tools" body={app.current_tools} />}
          {app.current_tools_pros && <Section title="What works" body={app.current_tools_pros} />}
          {app.current_tools_cons && <Section title="What doesn't" body={app.current_tools_cons} />}

          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
              Business in numbers
            </h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Metric label="Villas" value={app.villa_count?.toString() || '—'} />
              <Metric label="Years" value={app.years_hosting?.toString() || '—'} />
              <Metric label="Team" value={app.team_size?.toString() || '—'} />
              <Metric label="Occupancy" value={app.occupancy_pct ? `${app.occupancy_pct}%` : '—'} />
            </div>
            {app.channels && app.channels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {app.channels.map((c: string) => (
                  <span
                    key={c}
                    className="rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy/70"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media — hero photo + voice note */}
          {(app.hero_photo_url || app.voice_note_url) && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Media submitted
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {app.hero_photo_url && (
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-coral">
                      Hero photo
                    </div>
                    <a href={app.hero_photo_url} target="_blank" rel="noopener" className="block">
                      <img
                        src={app.hero_photo_url}
                        alt="Hero submitted by applicant"
                        className="w-full rounded-xl object-cover transition-opacity hover:opacity-90"
                        style={{ aspectRatio: '4 / 3' }}
                      />
                    </a>
                    <a
                      href={app.hero_photo_url}
                      target="_blank"
                      rel="noopener"
                      className="mt-2 inline-block text-[11px] text-warm-gray underline-offset-2 hover:underline"
                    >
                      Open full size →
                    </a>
                  </div>
                )}

                {app.voice_note_url && (
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-teal">
                      Voice note
                      {app.voice_note_duration_sec
                        ? ` · ${app.voice_note_duration_sec}s`
                        : ''}
                    </div>
                    <div className="rounded-xl border border-line bg-cream p-4">
                      <audio
                        src={app.voice_note_url}
                        controls
                        className="w-full"
                        style={{ height: 40 }}
                      />
                      <a
                        href={app.voice_note_url}
                        download
                        className="mt-2 inline-block text-[11px] text-warm-gray underline-offset-2 hover:underline"
                      >
                        Download audio →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {!app.hero_photo_url && (
                <div className="mt-3 text-xs text-warm-gray">
                  No hero photo uploaded.
                </div>
              )}
              {!app.voice_note_url && (
                <div className="mt-3 text-xs text-warm-gray">
                  No voice note recorded.
                </div>
              )}
            </div>
          )}

          {/* If neither media exists, show a small note instead */}
          {!app.hero_photo_url && !app.voice_note_url && (
            <div className="rounded-2xl border border-dashed border-line bg-cream/30 p-4 text-center text-xs text-warm-gray">
              No photo or voice note submitted (Quick Apply mode or skipped).
            </div>
          )}

          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
              Consents
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                {app.consent_to_publish_name ? '✓' : '✗'} Consents to public name display
              </div>
              <div>
                {app.willing_for_case_study ? '✓' : '✗'} Open to case study
              </div>
            </div>
          </div>
        </div>

        {/* Scoring column */}
        <div className="space-y-5">
          <AIAssessmentPanel app={app} />
          <FollowupPanel app={app} />

          <ScoringPanel
            applicationId={app.id}
            existingScores={scores || []}
            currentUserId={currentAdminId}
          />

          <StatusTransition
            applicationId={app.id}
            currentStatus={app.status}
            hasWhatsApp={!!app.whatsapp}
          />

          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
              Timeline
            </h3>
            <div className="space-y-1 text-xs text-warm-gray">
              <div>Submitted: {app.submitted_at ? formatDate(app.submitted_at) : '—'}</div>
              <div>Shortlisted: {app.shortlisted_at ? formatDate(app.shortlisted_at) : '—'}</div>
              <div>Finalist: {app.finalist_at ? formatDate(app.finalist_at) : '—'}</div>
              <div>Winner: {app.winner_at ? formatDate(app.winner_at) : '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AI Assessment Panel
// ============================================================================
function AIAssessmentPanel({ app }: { app: any }) {
  // Show empty state if not yet assessed
  if (!app.ai_assessed_at) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-5">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-warm-gray">
          AI Assessment
        </h3>
        <p className="mb-4 text-xs text-warm-gray">
          Not yet assessed. AI runs automatically on submit. Older submissions before this feature won't have one.
        </p>
        <ReassessButton applicationId={app.id} hasExisting={false} />
      </div>
    );
  }

  const fitColors: Record<string, string> = {
    strong: 'bg-teal/15 text-teal',
    borderline: 'bg-gold/20 text-burgundy',
    weak: 'bg-burgundy/15 text-burgundy',
  };
  const scoreColor = (score: number | null) => {
    if (score === null || score === undefined) return 'text-warm-gray';
    if (score >= 8) return 'text-teal';
    if (score >= 6) return 'text-gold';
    return 'text-burgundy';
  };

  const story = app.ai_story_score;
  const growth = app.ai_growth_score;
  const weighted =
    story !== null && story !== undefined && growth !== null && growth !== undefined
      ? (story * 0.5 + growth * 0.3).toFixed(2)
      : null;

  return (
    <div className="rounded-2xl border-l-4 border-coral bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-coral">
          🤖 AI Assessment
        </h3>
        {app.ai_category_fit && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${fitColors[app.ai_category_fit] || 'bg-cream text-navy'}`}
          >
            {app.ai_category_fit} fit
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-cream p-3 text-center">
        <div>
          <div className={`font-serif text-2xl ${scoreColor(story)}`}>
            {story ?? '—'}
            {story !== null && <span className="text-xs text-warm-gray">/10</span>}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-warm-gray">Story</div>
        </div>
        <div>
          <div className={`font-serif text-2xl ${scoreColor(growth)}`}>
            {growth ?? '—'}
            {growth !== null && <span className="text-xs text-warm-gray">/10</span>}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-warm-gray">Growth</div>
        </div>
        <div>
          <div className="font-serif text-2xl text-coral">{weighted ?? '—'}</div>
          <div className="text-[10px] uppercase tracking-wider text-warm-gray">Weighted</div>
        </div>
      </div>

      {/* Summary */}
      {app.ai_summary && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-warm-gray">
            Summary
          </div>
          <p className="text-sm leading-relaxed text-navy/85">{app.ai_summary}</p>
        </div>
      )}

      {/* Recommendation */}
      {app.ai_recommendation && (
        <div className="mb-3 rounded-xl border-l-2 border-coral/50 bg-coral/5 px-3 py-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-coral">
            Recommendation
          </div>
          <p className="text-sm leading-relaxed text-navy/85">{app.ai_recommendation}</p>
        </div>
      )}

      {/* Red Flags */}
      {app.ai_red_flags && (
        <div className="rounded-xl border-l-2 border-burgundy bg-burgundy/5 px-3 py-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-burgundy">
            ⚠ Red flags
          </div>
          <p className="text-sm leading-relaxed text-navy/85">{app.ai_red_flags}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="text-[10px] text-warm-gray">
          Assessed {formatDate(app.ai_assessed_at)}
        </div>
      </div>
      <div className="mt-2">
        <ReassessButton applicationId={app.id} hasExisting={true} />
      </div>
    </div>
  );
}

// ============================================================================
// Followup Panel
// ============================================================================
function FollowupPanel({ app }: { app: any }) {
  const hasFollowup = app.followup_questions && Array.isArray(app.followup_questions) && app.followup_questions.length > 0;

  if (!hasFollowup && !app.followup_scheduled_at && !app.followup_sent_at) {
    return null; // Nothing to show
  }

  // Status determination
  let statusLabel = '';
  let statusColor = '';
  if (app.followup_sent_at) {
    statusLabel = `Sent ${formatDate(app.followup_sent_at)}`;
    statusColor = 'bg-teal/15 text-teal';
  } else if (app.followup_scheduled_at) {
    const isOverdue = new Date(app.followup_scheduled_at) < new Date();
    statusLabel = isOverdue
      ? `Overdue (was ${formatDate(app.followup_scheduled_at)})`
      : `Scheduled ${formatDate(app.followup_scheduled_at)}`;
    statusColor = isOverdue ? 'bg-burgundy/15 text-burgundy' : 'bg-gold/20 text-burgundy';
  }

  return (
    <div className="rounded-2xl border-l-4 border-teal bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-teal">
          💬 Follow-up
        </h3>
        {statusLabel && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {hasFollowup && (
        <div className="space-y-3">
          {(app.followup_questions as Array<any>).map((q, i) => (
            <div key={i} className="rounded-xl bg-cream p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-warm-gray">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-coral">
                  {q.field}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-navy">{q.question}</p>
              {q.reason && (
                <p className="mt-1.5 text-[11px] italic text-warm-gray">
                  Why: {q.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {app.last_edited_at && (
        <div className="mt-3 text-[10px] text-warm-gray">
          Applicant last edited: {formatDate(app.last_edited_at)}
          {app.edit_count ? ` · ${app.edit_count} edits` : ''}
        </div>
      )}
    </div>
  );
}

function Section({ title, body, italic }: { title: string; body: string; italic?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-coral">{title}</h3>
      <p className={`text-sm leading-relaxed text-navy ${italic ? 'italic' : ''}`}>{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-2xl text-navy">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-warm-gray">{label}</div>
    </div>
  );
}
