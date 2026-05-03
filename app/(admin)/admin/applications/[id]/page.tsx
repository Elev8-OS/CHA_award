import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ScoringPanel } from '@/components/admin/ScoringPanel';
import { StatusTransition } from '@/components/admin/StatusTransition';
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
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-cream"
          >
            View public page →
          </Link>
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
          <ScoringPanel applicationId={app.id} existingScores={scores || []} />

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
