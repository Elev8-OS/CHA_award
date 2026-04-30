-- ============================================================================
-- CHA Awards 2026 — Migration 04: Reminders + Referrer Attribution + Snapshots
-- Run AFTER Migrations 01, 02, 03
-- ============================================================================

-- ----- Reminder tracking (dedup which applicants got which reminders) -----

create table if not exists reminder_sends (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  reminder_type text not null,                  -- 'submission_24h', 'submission_6h', 'share_24h'
  channel text not null,                        -- 'whatsapp', 'email'
  status text not null default 'sent',          -- 'sent', 'failed'
  error_message text,
  sent_at timestamptz default now(),

  unique(application_id, reminder_type, channel)
);

create index if not exists idx_reminder_sends_application on reminder_sends(application_id);
create index if not exists idx_reminder_sends_type on reminder_sends(reminder_type);

-- ----- Cron run log (for auditing) -----

create table if not exists cron_runs (
  id uuid primary key default uuid_generate_v4(),
  job_name text not null,
  status text not null,                         -- 'success', 'failed'
  records_processed int default 0,
  duration_ms int,
  error_message text,
  ran_at timestamptz default now()
);

create index if not exists idx_cron_runs_job on cron_runs(job_name, ran_at desc);

-- ----- Daily snapshots for time-series analytics -----

create table if not exists daily_snapshots (
  id uuid primary key default uuid_generate_v4(),
  snapshot_date date not null unique,
  total_drafts int default 0,
  total_submitted int default 0,
  total_shortlisted int default 0,
  total_finalists int default 0,
  total_winners int default 0,
  total_votes int default 0,
  total_views int default 0,
  total_shares int default 0,
  boutique_count int default 0,
  growing_count int default 0,
  scaled_count int default 0,
  whatsapp_messages_sent int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_snapshots_date on daily_snapshots(snapshot_date desc);

-- Function to capture today's snapshot
create or replace function capture_daily_snapshot()
returns void as $$
declare
  today date := current_date;
begin
  insert into daily_snapshots (
    snapshot_date,
    total_drafts,
    total_submitted,
    total_shortlisted,
    total_finalists,
    total_winners,
    total_votes,
    total_views,
    total_shares,
    boutique_count,
    growing_count,
    scaled_count,
    whatsapp_messages_sent
  )
  select
    today,
    (select count(*) from applications where status = 'draft'),
    (select count(*) from applications where status != 'draft'),
    (select count(*) from applications where status in ('shortlisted', 'finalist', 'winner')),
    (select count(*) from applications where status in ('finalist', 'winner')),
    (select count(*) from applications where status = 'winner'),
    (select count(*) from vote_events where is_verified = true),
    (select count(*) from page_views),
    (select count(*) from share_events),
    (select count(*) from applications where category = 'boutique' and status != 'draft'),
    (select count(*) from applications where category = 'growing' and status != 'draft'),
    (select count(*) from applications where category = 'scaled' and status != 'draft'),
    (select count(*) from whatsapp_messages where direction = 'outbound')
  on conflict (snapshot_date) do update set
    total_drafts = excluded.total_drafts,
    total_submitted = excluded.total_submitted,
    total_shortlisted = excluded.total_shortlisted,
    total_finalists = excluded.total_finalists,
    total_winners = excluded.total_winners,
    total_votes = excluded.total_votes,
    total_views = excluded.total_views,
    total_shares = excluded.total_shares,
    boutique_count = excluded.boutique_count,
    growing_count = excluded.growing_count,
    scaled_count = excluded.scaled_count,
    whatsapp_messages_sent = excluded.whatsapp_messages_sent;
end;
$$ language plpgsql;

-- ----- Referrer attribution view -----
-- "Maya's WhatsApp shares converted 23 votes"

create or replace view referrer_attribution as
select
  ref_app.public_slug as referrer_slug,
  ref_app.business_name as referrer_business_name,
  ref_app.full_name as referrer_full_name,
  ve.application_id as voted_for_id,
  voted_app.business_name as voted_for_business_name,
  count(*) filter (where ve.is_verified = true) as verified_vote_count,
  count(*) filter (where ve.is_verified = false) as pending_vote_count
from vote_events ve
join applications ref_app on ref_app.public_slug = ve.referrer_slug
left join applications voted_app on voted_app.id = ve.application_id
where ve.referrer_slug is not null
group by ref_app.public_slug, ref_app.business_name, ref_app.full_name,
         ve.application_id, voted_app.business_name;

-- ----- Per-applicant share→vote conversion summary -----

create or replace view share_conversion_summary as
select
  a.id,
  a.public_slug,
  a.business_name,
  a.full_name,
  a.category,
  count(distinct se.id) as total_shares,
  count(distinct se.id) filter (where se.channel = 'whatsapp') as whatsapp_shares,
  count(distinct se.id) filter (where se.channel = 'linkedin') as linkedin_shares,
  count(distinct se.id) filter (where se.channel = 'copy') as copy_shares,
  count(distinct ve_self.id) filter (where ve_self.is_verified = true) as own_votes,
  -- votes attributed to this applicant's shares (votes for OTHER applicants from this referrer)
  count(distinct ve_attributed.id) filter (where ve_attributed.is_verified = true) as votes_driven_to_others
from applications a
left join share_events se on se.application_id = a.id
left join vote_events ve_self on ve_self.application_id = a.id
left join vote_events ve_attributed on ve_attributed.referrer_slug = a.public_slug
where a.is_public = true
group by a.id, a.public_slug, a.business_name, a.full_name, a.category;

-- ----- RLS for new tables -----

alter table reminder_sends enable row level security;
alter table cron_runs enable row level security;
alter table daily_snapshots enable row level security;

drop policy if exists "Admins read reminders" on reminder_sends;
create policy "Admins read reminders"
  on reminder_sends for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

drop policy if exists "Admins read cron" on cron_runs;
create policy "Admins read cron"
  on cron_runs for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

drop policy if exists "Admins read snapshots" on daily_snapshots;
create policy "Admins read snapshots"
  on daily_snapshots for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- ----- Realtime publication for vote events -----
-- Allows clients to subscribe to vote_events INSERT events

alter publication supabase_realtime add table vote_events;
alter publication supabase_realtime add table applications;
