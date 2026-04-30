-- ============================================================================
-- CHA Awards 2026 — Migration 02: Public Applicant Pages + Voting
-- ============================================================================

-- ----- Add public-page-relevant fields to applications -----

alter table applications
  add column if not exists public_slug text unique,                    -- e.g. "maya-susanti-bali-villa-co"
  add column if not exists is_public boolean default false,            -- visible on /v/[slug]
  add column if not exists hero_photo_url text,                        -- profile photo
  add column if not exists logo_url text,                              -- business logo
  add column if not exists short_pitch text,                           -- 280 chars elevator pitch for share previews
  add column if not exists share_voice_message_url text,               -- optional voice plea
  add column if not exists view_count int default 0,
  add column if not exists share_count int default 0;

create index if not exists idx_applications_public_slug on applications(public_slug);
create index if not exists idx_applications_is_public on applications(is_public);

-- ----- Slug auto-generation function -----

create or replace function generate_unique_slug(base_text text)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Slugify: lowercase, replace non-alphanumeric with hyphens
  base_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substr(base_slug, 1, 60);

  if base_slug = '' or base_slug is null then
    base_slug := 'applicant';
  end if;

  final_slug := base_slug;

  -- Handle collisions
  while exists(select 1 from applications where public_slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$ language plpgsql;

-- Auto-set slug on submission
create or replace function set_public_slug_on_submit()
returns trigger as $$
begin
  if new.status = 'submitted' and old.status = 'draft' and new.public_slug is null then
    new.public_slug := generate_unique_slug(coalesce(new.business_name, new.full_name, 'applicant'));
    new.is_public := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_public_slug on applications;
create trigger trg_public_slug
  before update on applications
  for each row execute function set_public_slug_on_submit();

-- ----- Vote events table (replaces simple community_votes for richer tracking) -----

create table if not exists vote_events (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,

  -- Voter info
  voter_whatsapp text not null,
  voter_name text,
  voter_location text,                                  -- voluntary, "Pererenan", "Singapore", etc.

  -- Anti-abuse
  ip_hash text not null,
  user_agent_hash text,
  fingerprint text,                                     -- browser fingerprint hash

  -- Verification
  is_verified boolean default false,
  verified_at timestamptz,
  verification_code text,                               -- 6-digit OTP via WhatsApp

  -- Source tracking
  referrer_slug text,                                   -- if voter came from share link
  utm_source text,
  utm_medium text,

  created_at timestamptz default now(),

  unique(application_id, voter_whatsapp)
);

create index if not exists idx_vote_events_application on vote_events(application_id);
create index if not exists idx_vote_events_verified on vote_events(is_verified);
create index if not exists idx_vote_events_created on vote_events(created_at desc);

-- ----- Page views tracking (per applicant page) -----

create table if not exists page_views (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references applications(id) on delete cascade,
  page_path text not null,
  referrer text,
  ip_hash text,
  user_agent text,
  country text,
  city text,
  created_at timestamptz default now()
);

create index if not exists idx_page_views_application on page_views(application_id);
create index if not exists idx_page_views_created on page_views(created_at desc);

-- ----- Share events tracking -----

create table if not exists share_events (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references applications(id) on delete cascade,
  channel text not null,                                -- 'whatsapp', 'linkedin', 'copy', 'instagram'
  ip_hash text,
  created_at timestamptz default now()
);

create index if not exists idx_share_events_application on share_events(application_id);

-- ----- Live category leaderboard view -----

create or replace view category_leaderboard as
select
  a.id,
  a.public_slug,
  a.full_name,
  a.business_name,
  a.category,
  a.location,
  a.hero_photo_url,
  count(distinct ve.id) filter (where ve.is_verified = true) as vote_count,
  rank() over (
    partition by a.category
    order by count(distinct ve.id) filter (where ve.is_verified = true) desc
  ) as category_rank
from applications a
left join vote_events ve on ve.application_id = a.id
where a.is_public = true and a.status in ('submitted', 'shortlisted', 'finalist')
group by a.id, a.public_slug, a.full_name, a.business_name, a.category, a.location, a.hero_photo_url;

-- ----- Public-safe applicant view (no PII) -----

create or replace view public_applicant_view as
select
  a.id,
  a.public_slug,
  case when a.consent_to_publish_name then a.full_name else null end as full_name,
  a.business_name,
  a.category,
  a.location,
  a.villa_count,
  a.years_hosting,
  a.hero_photo_url,
  a.logo_url,
  a.short_pitch,
  a.share_voice_message_url,
  case when a.consent_to_publish_name then a.biggest_headache else null end as biggest_headache,
  case when a.consent_to_publish_name then a.first_attack else null end as first_attack,
  case when a.consent_to_publish_name then a.twelve_month_vision else null end as twelve_month_vision,
  case when a.consent_to_publish_name then a.why_you else null end as why_you,
  a.willing_for_case_study,
  a.view_count,
  a.share_count,
  a.submitted_at,
  count(distinct ve.id) filter (where ve.is_verified = true) as vote_count,
  rank() over (
    partition by a.category
    order by count(distinct ve.id) filter (where ve.is_verified = true) desc
  ) as category_rank
from applications a
left join vote_events ve on ve.application_id = a.id
where a.is_public = true
group by a.id;

-- ----- Increment view counter (atomic) -----

create or replace function increment_view_count(app_id uuid)
returns void as $$
begin
  update applications set view_count = view_count + 1 where id = app_id;
end;
$$ language plpgsql;

create or replace function increment_share_count(app_id uuid)
returns void as $$
begin
  update applications set share_count = share_count + 1 where id = app_id;
end;
$$ language plpgsql;

-- ----- RLS for new tables -----

alter table vote_events enable row level security;
alter table page_views enable row level security;
alter table share_events enable row level security;

create policy "Anyone can create vote event"
  on vote_events for insert
  with check (true);

create policy "Anyone can read verified votes"
  on vote_events for select
  using (is_verified = true);

create policy "Admins can read all votes"
  on vote_events for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

create policy "Anyone can log page view"
  on page_views for insert
  with check (true);

create policy "Anyone can log share event"
  on share_events for insert
  with check (true);

create policy "Admins can read tracking"
  on page_views for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

create policy "Admins can read shares"
  on share_events for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );
