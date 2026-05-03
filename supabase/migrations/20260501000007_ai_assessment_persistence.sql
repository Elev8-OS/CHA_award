-- ============================================================================
-- Persist AI assessment fields on applications
-- ============================================================================
-- Until now AI assessments were sent only in the admin notification email
-- and never persisted. This means the admin can't see them later in the
-- dashboard, can't compare across applications, and can't display them to
-- the jury alongside the human scores.
--
-- This migration adds columns for the assessment so the admin detail page
-- can render a full "AI Assessment" panel.
-- ============================================================================

alter table applications
  add column if not exists ai_story_score int check (ai_story_score >= 0 and ai_story_score <= 10),
  add column if not exists ai_growth_score int check (ai_growth_score >= 0 and ai_growth_score <= 10),
  add column if not exists ai_summary text,
  add column if not exists ai_recommendation text,
  add column if not exists ai_red_flags text,
  add column if not exists ai_category_fit text check (ai_category_fit in ('strong', 'borderline', 'weak') or ai_category_fit is null),
  add column if not exists ai_assessed_at timestamptz;

comment on column applications.ai_story_score is 'AI-generated story score 0-10 (Claude assessment of submitted form data)';
comment on column applications.ai_growth_score is 'AI-generated growth score 0-10 (Claude assessment of submitted form data)';
comment on column applications.ai_summary is 'AI-generated 2-3 sentence summary of the applicant for jury context';
comment on column applications.ai_recommendation is 'AI-generated recommendation text for the jury';
comment on column applications.ai_red_flags is 'AI-flagged concerns or null if none';
comment on column applications.ai_category_fit is 'Whether the chosen category seems right (strong/borderline/weak)';
comment on column applications.ai_assessed_at is 'When the AI assessment was performed';

-- Index for filtering by assessment status
create index if not exists idx_applications_ai_assessed
  on applications(ai_assessed_at)
  where ai_assessed_at is not null;
