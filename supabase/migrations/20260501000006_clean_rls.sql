-- ============================================================================
-- RLS REFACTOR — Clean Architecture
--
-- Problem with previous policies:
-- Many policies referenced admin_users via subquery
-- (auth.jwt() ->> 'email' in (select email from admin_users where ...)).
-- This is recursive when reading admin_users itself, and unreliable when the
-- subquery itself is gated by RLS. This caused jury users to be unable to
-- read or write jury_scores even with valid auth.
--
-- New architecture:
-- 1. Public-facing operations (apply, vote, page-view tracking) keep simple
--    "anyone can insert" policies — these have no admin_users dependency.
-- 2. Public READ access to applicant data goes through public_* views which
--    enforce status='submitted' implicitly, no admin_users lookup needed.
-- 3. ALL admin/jury operations go through server APIs with the SERVICE ROLE
--    key. No direct client access to admin-protected tables.
-- 4. Admin-protected tables (admin_users, jury_scores, applications-as-admin,
--    analytics, snapshots, etc.) get default-deny policies for the anon and
--    authenticated roles. Service role bypasses RLS automatically.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DROP previous admin-related policies that referenced admin_users
-- ----------------------------------------------------------------------------

-- applications
drop policy if exists "Admins can read all applications" on applications;
drop policy if exists "Admins can update applications" on applications;

-- jury_scores
drop policy if exists "Jurors can read all scores" on jury_scores;
drop policy if exists "Jurors can manage own scores" on jury_scores;

-- community_votes
drop policy if exists "Admins can read votes" on community_votes;

-- whatsapp_messages
drop policy if exists "Admins can manage whatsapp" on whatsapp_messages;

-- admin_users
drop policy if exists "Admins can read admin list" on admin_users;

-- analytics_events
drop policy if exists "Admins can read analytics" on analytics_events;

-- vote_events
drop policy if exists "Admins can read all votes" on vote_events;

-- page_views
drop policy if exists "Admins can read tracking" on page_views;

-- share_events
drop policy if exists "Admins can read shares" on share_events;

-- reminder_sends
drop policy if exists "Admins read reminders" on reminder_sends;

-- cron_runs
drop policy if exists "Admins read cron" on cron_runs;

-- daily_snapshots
drop policy if exists "Admins read snapshots" on daily_snapshots;

-- referrer_attribution (if exists)
drop policy if exists "Admins read referrers" on referrer_attribution;

-- ----------------------------------------------------------------------------
-- KEEP / RE-ASSERT public-facing policies (no admin_users dependency)
-- ----------------------------------------------------------------------------

-- applications: anyone can create a draft (continue_token validates ownership in API)
drop policy if exists "Anyone can create application" on applications;
create policy "Anyone can create application"
  on applications for insert
  with check (true);

-- community_votes: public voting (rate limit / verification done in API)
drop policy if exists "Anyone can vote" on community_votes;
create policy "Anyone can vote"
  on community_votes for insert
  with check (true);

-- vote_events: public can insert + read verified
drop policy if exists "Anyone can create vote event" on vote_events;
create policy "Anyone can create vote event"
  on vote_events for insert
  with check (true);

drop policy if exists "Anyone can read verified votes" on vote_events;
create policy "Anyone can read verified votes"
  on vote_events for select
  using (is_verified = true);

-- analytics_events: public can log
drop policy if exists "Anyone can log events" on analytics_events;
create policy "Anyone can log events"
  on analytics_events for insert
  with check (true);

-- page_views: public can log
drop policy if exists "Anyone can log page view" on page_views;
create policy "Anyone can log page view"
  on page_views for insert
  with check (true);

-- share_events: public can log
drop policy if exists "Anyone can log share event" on share_events;
create policy "Anyone can log share event"
  on share_events for insert
  with check (true);

-- ----------------------------------------------------------------------------
-- DEFAULT-DENY for all admin-protected tables
--
-- After dropping admin policies, RLS is enabled but no SELECT/UPDATE/DELETE
-- policies remain. This means:
--   - anon role: can do nothing except the public INSERT policies above
--   - authenticated role: can do nothing except the public INSERT policies
--   - service_role: bypasses RLS entirely (used by all server APIs)
--
-- This is the desired state. No additional policies needed.
-- ----------------------------------------------------------------------------

-- Make sure RLS is enabled on all admin-protected tables (no-op if already on)
alter table applications enable row level security;
alter table jury_scores enable row level security;
alter table admin_users enable row level security;
alter table community_votes enable row level security;
alter table whatsapp_messages enable row level security;
alter table analytics_events enable row level security;

-- Tables from later migrations
do $$
begin
  if to_regclass('public.vote_events') is not null then
    execute 'alter table vote_events enable row level security';
  end if;
  if to_regclass('public.page_views') is not null then
    execute 'alter table page_views enable row level security';
  end if;
  if to_regclass('public.share_events') is not null then
    execute 'alter table share_events enable row level security';
  end if;
  if to_regclass('public.reminder_sends') is not null then
    execute 'alter table reminder_sends enable row level security';
  end if;
  if to_regclass('public.cron_runs') is not null then
    execute 'alter table cron_runs enable row level security';
  end if;
  if to_regclass('public.daily_snapshots') is not null then
    execute 'alter table daily_snapshots enable row level security';
  end if;
  if to_regclass('public.referrer_attribution') is not null then
    execute 'alter table referrer_attribution enable row level security';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- PUBLIC VIEWS — already used in code, keep accessible
-- These are SECURITY INVOKER views that filter to safe public data only.
-- Anon role needs SELECT on them (which it already has by default since they
-- are in the public schema). No RLS policy needed for views.
-- ----------------------------------------------------------------------------

-- public_applicant_view, public_application_stats, category_leaderboard,
-- application_scores_summary, share_conversion_summary — these views already
-- exist from earlier migrations and filter to status='submitted'. They are
-- read-only and safe for anon access.

-- Grant SELECT explicitly to be safe
grant select on public_applicant_view to anon, authenticated;
grant select on public_application_stats to anon, authenticated;

do $$
begin
  if to_regclass('public.category_leaderboard') is not null then
    execute 'grant select on category_leaderboard to anon, authenticated';
  end if;
  if to_regclass('public.application_scores_summary') is not null then
    execute 'grant select on application_scores_summary to anon, authenticated';
  end if;
  if to_regclass('public.share_conversion_summary') is not null then
    execute 'grant select on share_conversion_summary to anon, authenticated';
  end if;
end $$;
