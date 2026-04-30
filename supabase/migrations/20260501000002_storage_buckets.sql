-- ============================================================================
-- CHA Awards 2026 — Migration 03: Storage Buckets
-- Run AFTER Migration 01 + 02
-- ============================================================================

-- ----- Create storage buckets -----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'applicant-photos',
    'applicant-photos',
    true,                                -- public bucket
    5242880,                             -- 5MB limit
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'applicant-voice',
    'applicant-voice',
    true,                                -- public bucket
    3145728,                             -- 3MB limit (~30s audio)
    array['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/wav']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----- RLS for storage objects -----

-- Anyone can read public buckets
drop policy if exists "Public can read photos" on storage.objects;
create policy "Public can read photos"
  on storage.objects for select
  using (bucket_id in ('applicant-photos', 'applicant-voice'));

-- Service role uploads (we proxy through API route for validation)
-- Anonymous users CANNOT directly write — they must go through /api/upload/*
-- which validates continue_token and uses service role internally
drop policy if exists "Service role uploads" on storage.objects;
create policy "Service role uploads"
  on storage.objects for insert
  with check (
    bucket_id in ('applicant-photos', 'applicant-voice')
    and auth.role() = 'service_role'
  );

drop policy if exists "Service role updates" on storage.objects;
create policy "Service role updates"
  on storage.objects for update
  using (
    bucket_id in ('applicant-photos', 'applicant-voice')
    and auth.role() = 'service_role'
  );

drop policy if exists "Service role deletes" on storage.objects;
create policy "Service role deletes"
  on storage.objects for delete
  using (
    bucket_id in ('applicant-photos', 'applicant-voice')
    and auth.role() = 'service_role'
  );

-- ----- Track uploaded media on application -----

alter table applications
  add column if not exists hero_photo_path text,
  add column if not exists share_voice_path text;

-- ----- Update public_applicant_view to include voice URL -----

drop view if exists public_applicant_view;

create view public_applicant_view as
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
  a.hero_photo_path,
  a.logo_url,
  a.short_pitch,
  a.share_voice_message_url,
  a.share_voice_path,
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
