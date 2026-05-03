-- ============================================================================
-- Migration 06: Follow-up questions + post-submit edits
-- Run AFTER previous migrations.
-- ============================================================================

-- Track if a follow-up was sent (limit to 1 per application to avoid spam)
alter table applications
  add column if not exists followup_sent_at timestamptz,
  add column if not exists followup_questions jsonb,
  add column if not exists last_edited_at timestamptz,
  add column if not exists edit_count int default 0;

-- Index for cron / analytics queries
create index if not exists idx_applications_followup_sent
  on applications(followup_sent_at)
  where followup_sent_at is not null;

-- Allow updates to submitted applications (specific fields only, via API)
-- RLS for this is handled in API routes, not at DB level

comment on column applications.followup_sent_at is
  'Timestamp when AI follow-up questions were sent. Used to prevent duplicate sends.';
comment on column applications.followup_questions is
  'JSONB array of follow-up question objects: [{ field: "biggest_headache", question: "...", reason: "..." }]';
