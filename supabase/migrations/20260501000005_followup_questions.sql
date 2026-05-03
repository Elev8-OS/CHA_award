-- ============================================================================
-- Migration 06: Follow-up questions + post-submit edits
-- Run AFTER previous migrations.
-- ============================================================================

-- Track if a follow-up was sent + when it should be sent
alter table applications
  add column if not exists followup_scheduled_at timestamptz,
  add column if not exists followup_sent_at timestamptz,
  add column if not exists followup_questions jsonb,
  add column if not exists last_edited_at timestamptz,
  add column if not exists edit_count int default 0;

-- Index for cron picking up due followups
create index if not exists idx_applications_followup_scheduled
  on applications(followup_scheduled_at)
  where followup_scheduled_at is not null and followup_sent_at is null;

create index if not exists idx_applications_followup_sent
  on applications(followup_sent_at)
  where followup_sent_at is not null;

comment on column applications.followup_scheduled_at is
  'When the follow-up SHOULD be sent (in the future). Cron picks up rows where this is past + followup_sent_at is null.';
comment on column applications.followup_sent_at is
  'Timestamp when AI follow-up questions were actually sent. Used to prevent duplicate sends.';
comment on column applications.followup_questions is
  'JSONB array of follow-up question objects: [{ field: "biggest_headache", question: "...", reason: "..." }]';
