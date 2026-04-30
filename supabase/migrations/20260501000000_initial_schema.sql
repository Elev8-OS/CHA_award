-- ============================================================================
-- CHA Awards 2026 — Initial Schema
-- Run this in Supabase SQL Editor or via CLI migration
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type application_status as enum (
  'draft',           -- saved but not submitted
  'submitted',       -- complete, awaiting review
  'shortlisted',     -- top 10 candidates
  'finalist',        -- top 5
  'winner',          -- top 3
  'rejected'         -- not selected
);

create type application_category as enum (
  'boutique',        -- 1-3 villas
  'growing',         -- 4-9 villas
  'scaled'           -- 10+ villas
);

create type application_mode as enum (
  'quick',           -- 3-min quick apply
  'deep'             -- 12-min deep story
);

create type whatsapp_direction as enum (
  'inbound',
  'outbound'
);

create type whatsapp_status as enum (
  'queued',
  'sent',
  'delivered',
  'read',
  'failed'
);

create type admin_role as enum (
  'jury',            -- can score applications
  'admin',           -- full access
  'viewer'           -- read-only
);

-- ============================================================================
-- ADMIN USERS
-- ============================================================================

create table admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null,
  role admin_role not null default 'jury',
  organization text,             -- "CHA", "elev8", "Grün Resorts", etc.
  jury_seat_color text,          -- 'coral', 'teal', 'burgundy', 'gold'
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_admin_users_email on admin_users(email);
create index idx_admin_users_role on admin_users(role);

-- ============================================================================
-- APPLICATIONS
-- ============================================================================

create table applications (
  id uuid primary key default uuid_generate_v4(),

  -- Continuation token for save & continue
  continue_token text unique not null default replace(uuid_generate_v4()::text, '-', ''),

  -- Mode and status
  mode application_mode not null default 'quick',
  status application_status not null default 'draft',

  -- Step 1: Basics
  full_name text,
  business_name text,
  email text,
  whatsapp text,
  location text,                                  -- e.g. "Pererenan", "Berawa"
  attending_villa_connect text,                   -- 'yes' | 'no' | 'maybe'

  -- Step 2: Business in Numbers
  villa_count int,                                -- triggers category derivation
  category application_category,                  -- auto-set based on villa_count
  years_hosting int,
  team_size int,
  occupancy_pct int,                              -- 0-100
  channels jsonb default '[]'::jsonb,             -- ["airbnb", "booking", "agoda", "direct", "other"]

  -- Step 3: Current Setup
  current_tools text,
  current_tools_pros text,
  current_tools_cons text,                        -- pain point gold

  -- Step 4: The Story (deep mode only)
  biggest_headache text,                          -- max 500 chars
  first_attack text,                              -- max 500 chars
  twelve_month_vision text,                       -- max 500 chars
  why_you text,                                   -- max 1000 chars

  -- Step 5: Optional
  video_pitch_url text,
  willing_for_case_study boolean default false,
  consent_to_publish_name boolean default false,

  -- Meta
  language text default 'en',                     -- 'en' | 'id'
  source text,                                    -- 'whatsapp', 'direct', 'linkedin', etc.
  ip_address text,
  user_agent text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitted_at timestamptz,
  shortlisted_at timestamptz,
  finalist_at timestamptz,
  winner_at timestamptz
);

-- Indexes
create index idx_applications_status on applications(status);
create index idx_applications_category on applications(category);
create index idx_applications_continue_token on applications(continue_token);
create index idx_applications_email on applications(email);
create index idx_applications_submitted_at on applications(submitted_at desc);

-- Auto-derive category from villa_count
create or replace function derive_application_category()
returns trigger as $$
begin
  if new.villa_count is not null then
    if new.villa_count <= 3 then
      new.category := 'boutique';
    elsif new.villa_count <= 9 then
      new.category := 'growing';
    else
      new.category := 'scaled';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_derive_category
  before insert or update on applications
  for each row execute function derive_application_category();

-- ============================================================================
-- JURY SCORES
-- ============================================================================

create table jury_scores (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  juror_id uuid not null references admin_users(id) on delete cascade,

  -- Scoring (0-10 scale per criterion)
  story_score int check (story_score >= 0 and story_score <= 10),
  growth_potential_score int check (growth_potential_score >= 0 and growth_potential_score <= 10),

  -- Optional notes
  jury_notes text,

  -- Status
  is_finalized boolean default false,             -- locked after finalization

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(application_id, juror_id)
);

create index idx_jury_scores_application on jury_scores(application_id);
create index idx_jury_scores_juror on jury_scores(juror_id);

-- ============================================================================
-- COMMUNITY VOTES (Wildcard 20%)
-- ============================================================================

create table community_votes (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,

  -- Voter identification (no full account, but prevent dupes)
  voter_whatsapp text not null,
  voter_name text,
  voter_ip_hash text,                             -- hashed for dupe-prevention

  -- Validation
  is_cha_member boolean default false,
  verified_at timestamptz,

  created_at timestamptz default now(),

  unique(application_id, voter_whatsapp)
);

create index idx_community_votes_application on community_votes(application_id);
create index idx_community_votes_whatsapp on community_votes(voter_whatsapp);

-- ============================================================================
-- WHATSAPP MESSAGES (inbox + outbox)
-- ============================================================================

create table whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),

  -- Meta WhatsApp identifiers
  wa_message_id text unique,                      -- Meta's message ID
  wa_conversation_id text,
  phone_number text not null,                     -- E.164 format +62...

  -- Direction & status
  direction whatsapp_direction not null,
  status whatsapp_status default 'queued',

  -- Content
  message_type text default 'text',               -- 'text' | 'template' | 'image' | 'video'
  body text,
  template_name text,                             -- if template-based
  template_variables jsonb,
  media_url text,

  -- Linking
  application_id uuid references applications(id) on delete set null,
  sent_by_admin_id uuid references admin_users(id) on delete set null,

  -- Meta payloads (for debugging)
  raw_payload jsonb,
  error_message text,

  -- Timestamps
  created_at timestamptz default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz
);

create index idx_whatsapp_phone on whatsapp_messages(phone_number);
create index idx_whatsapp_application on whatsapp_messages(application_id);
create index idx_whatsapp_direction_status on whatsapp_messages(direction, status);
create index idx_whatsapp_created on whatsapp_messages(created_at desc);

-- ============================================================================
-- ANALYTICS EVENTS (page views, conversions, etc.)
-- ============================================================================

create table analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  application_id uuid references applications(id) on delete set null,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_analytics_event_name on analytics_events(event_name);
create index idx_analytics_created on analytics_events(created_at desc);

-- ============================================================================
-- VIEWS for Admin Dashboard
-- ============================================================================

-- Aggregated jury scores per application
create or replace view application_scores_summary as
select
  a.id as application_id,
  a.full_name,
  a.business_name,
  a.category,
  a.status,
  count(distinct js.juror_id) as juror_count,
  round(avg(js.story_score)::numeric, 2) as avg_story,
  round(avg(js.growth_potential_score)::numeric, 2) as avg_growth,
  round((avg(js.story_score) * 0.5 + avg(js.growth_potential_score) * 0.3)::numeric, 2) as jury_weighted_score,
  count(distinct cv.id) as community_vote_count
from applications a
left join jury_scores js on js.application_id = a.id
left join community_votes cv on cv.application_id = a.id
where a.status in ('submitted', 'shortlisted', 'finalist', 'winner')
group by a.id, a.full_name, a.business_name, a.category, a.status;

-- Live application stats for public display
create or replace view public_application_stats as
select
  count(*) filter (where status != 'draft') as total_submitted,
  count(*) filter (where status != 'draft' and category = 'boutique') as boutique_count,
  count(*) filter (where status != 'draft' and category = 'growing') as growing_count,
  count(*) filter (where status != 'draft' and category = 'scaled') as scaled_count
from applications;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table applications enable row level security;
alter table jury_scores enable row level security;
alter table community_votes enable row level security;
alter table whatsapp_messages enable row level security;
alter table admin_users enable row level security;
alter table analytics_events enable row level security;

-- ====== APPLICATIONS POLICIES ======

-- Public can insert (apply)
create policy "Anyone can create application"
  on applications for insert
  with check (true);

-- Public can update their own draft via continue_token
-- (handled via API route with token check, not RLS)

-- Authenticated admins can read all
create policy "Admins can read all applications"
  on applications for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- Authenticated admins can update
create policy "Admins can update applications"
  on applications for update
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true and role in ('admin', 'jury')
    )
  );

-- ====== JURY SCORES POLICIES ======

-- Jurors can read all scores (needed for aggregate views)
create policy "Jurors can read all scores"
  on jury_scores for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- Jurors can only insert/update their own scores
create policy "Jurors can manage own scores"
  on jury_scores for all
  using (
    juror_id in (
      select id from admin_users where email = auth.jwt() ->> 'email'
    )
  );

-- ====== COMMUNITY VOTES ======

-- Anyone can vote (with WhatsApp verification handled in API)
create policy "Anyone can vote"
  on community_votes for insert
  with check (true);

-- Admins can read votes
create policy "Admins can read votes"
  on community_votes for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- ====== WHATSAPP MESSAGES ======

-- Only admins can read/write WA messages
create policy "Admins can manage whatsapp"
  on whatsapp_messages for all
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- ====== ADMIN USERS ======

-- Admins can read other admins (needed for jury display)
create policy "Admins can read admin list"
  on admin_users for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users au where au.is_active = true
    )
  );

-- Only super-admins can manage admin users (handled in API)

-- ====== ANALYTICS ======

-- Anyone can insert analytics events
create policy "Anyone can log events"
  on analytics_events for insert
  with check (true);

create policy "Admins can read analytics"
  on analytics_events for select
  using (
    auth.jwt() ->> 'email' in (
      select email from admin_users where is_active = true
    )
  );

-- ============================================================================
-- SEED DATA — Initial Admin / Jury Users
-- ============================================================================
-- Run this AFTER you've signed up these users in Supabase Auth

-- IMPORTANT: Replace emails with real ones before running
insert into admin_users (email, full_name, role, organization, jury_seat_color) values
  ('YOUR_EMAIL@example.com',     'Your Name',          'admin', 'elev8',         null),
  ('reto.wyss@elev8-suite.com',  'Reto Wyss',          'jury',  'elev8',         'gold'),
  ('PAK_PRIMA_EMAIL',            'Pak Prima Hartawan', 'jury',  'CHA',           'coral'),
  ('MAYA_EMAIL',                 'Maya Susanti',       'jury',  'Lifestyle Residence Uluwatu', 'teal'),
  ('FLORIAN_EMAIL',              'Florian Holm',       'jury',  'Grün Resorts',  'burgundy')
on conflict (email) do nothing;

-- ============================================================================
-- DONE
-- ============================================================================
