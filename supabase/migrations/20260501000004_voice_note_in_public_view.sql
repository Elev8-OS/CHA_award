-- ============================================================================
-- Migration 05: Expose voice_note_url + voice_note_duration_sec in public view
-- ============================================================================
-- Run AFTER Migrations 01-04 in Supabase SQL Editor.
-- Fixes: voice notes recorded during the application now appear on
-- the public applicant page.
-- ============================================================================

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
  a.voice_note_url,
  a.voice_note_path,
  a.voice_note_duration_sec,
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
