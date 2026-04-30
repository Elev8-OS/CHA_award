# Step 4 — What's New

Building on Steps 1-3, this completes the platform with **automated reminders, real-time UI, public leaderboard, live admin dashboard, milestone communications, and referrer attribution**.

## What was added

### 1. Reminder Cron System
- **Migration 04** (`20260501000003_reminders_attribution_snapshots.sql`)
  - `reminder_sends` table — dedupes which applicants got which reminders
  - `cron_runs` table — audit log for all cron jobs
  - `daily_snapshots` table — time-series KPIs
  - `capture_daily_snapshot()` function — captures all KPIs for current date
  - Realtime publication added for `vote_events` + `applications`
- **`/api/cron/reminders`** (GET/POST, Bearer auth)
  - `submission_24h` — reminds drafts with email + WhatsApp 24h before deadline
  - `submission_6h` — urgent reminder 6h before
  - `share_24h` — nudges submitted applicants with <5 votes to share more
  - Dedupes via `reminder_sends` table — never sends same reminder twice
- **`/api/cron/snapshot`** (GET/POST, Bearer auth) — captures daily KPI snapshot

### 2. Real-time Vote Updates
- **`LiveVoteCount.tsx`** — Supabase Realtime subscription
  - `useLiveVoteCount` hook — auto-increments on new verified votes
  - `<AnimatedVoteCount>` component with pulse animation + glow effect
- Wired into ApplicantPage hero — vote count updates live without page refresh
- Animation triggers on every new verified vote

### 3. Public Leaderboard (`/leaderboard`)
- **`/leaderboard`** route — live ranking page across all 3 categories
- **`LeaderboardClient.tsx`**:
  - Subscribes to `vote_events` for ALL applicants
  - Auto re-ranks within categories when new votes come in
  - Pulse animation on whichever applicant just got a vote
  - Top 3 get medals (🥇🥈🥉), Top 5 get colored borders
  - Click any row → applicant's public page
- Linked from main nav

### 4. Live Admin Dashboard (`/admin`)
- Replaces old redirect with full KPI dashboard
- 6 KPI cards with deltas (today's new submissions, today's new votes)
- **`TimeSeriesChart.tsx`** — pure SVG chart (no external lib)
  - Toggleable series: Submitted / Votes / Views / Shares
  - 30-day window with interactive tooltips
- Latest applications + latest votes feeds
- Time-to-deadline indicator in header

### 5. Milestone Email + WhatsApp Templates
- **WhatsApp templates** added to `lib/whatsapp/templates.ts`:
  - `sendSubmissionReminder` — for incomplete drafts
  - `sendShareReminder` — for low-vote submitted applications
  - `sendShortlistNotification` — Top 10 (with strategy session reward)
  - `sendWinnerNotification` — Top 3 winners
  - All bilingual EN/ID with text fallback
- **Email templates** added to `lib/email/resend.ts`:
  - `sendShortlistEmail` — teal header, lists rewards
  - `sendFinalistEmail` — coral header, event details
  - `sendWinnerEmail` — gold header, prize breakdown
  - Shared `renderMilestoneHtml()` template renderer
- Status transitions in admin now auto-send appropriate WA + Email when "notify" is checked

### 6. Referrer Attribution
- **URL param tracking**: applicant share URLs include `?ref=THEIR_SLUG`
- ApplicantPage extracts `?ref=` from URL and stores in sessionStorage
- VoteModal forwards `referrer_slug` to `/api/votes/request-otp`
- Vote events get tagged with `referrer_slug` (only if voting for different applicant — no self-credit)
- **`share_conversion_summary` view** — joins shares & votes per applicant
- **Analytics page** now shows "Share → Vote conversion" table:
  - Per applicant: WA shares, LinkedIn shares, Copy shares, Total shares, Votes driven to others
  - Sorted by votes driven — surfaces most viral advocates

### 7. Countdown Banner
- **`CountdownBanner.tsx`** — sticky bottom-right banner
- Activates 48h before deadline, urgent mode (burgundy + 🔥) at 6h
- Real-time HH:MM:SS countdown
- "Apply" CTA button + dismissible (sessionStorage)
- Shown on landing + applicant pages

### 8. Bulk WhatsApp — Extended
- `/api/admin/whatsapp/bulk` now supports 6 templates:
  - `application_confirmation`, `shortlist_notification`, `finalist_notification`, `winner_notification`, `submission_reminder`, `custom`
- Use case: announce shortlist, congratulate finalists, send last-call reminders, etc.

## Database Migration to Run

```sql
-- In Supabase SQL Editor (after Migrations 01, 02, 03):
-- supabase/migrations/20260501000003_reminders_attribution_snapshots.sql
```

This migration **also enables Supabase Realtime** for `vote_events` and `applications` tables (needed for live vote updates and leaderboard).

If realtime doesn't work, manually verify in Supabase Dashboard:
- Settings → API → check that `vote_events` and `applications` are in publication `supabase_realtime`

## New Environment Variables

```env
# Cron auth — generate with: openssl rand -hex 32
CRON_SECRET=replace-with-random-secret-for-cron-endpoints

# Public version of close-at for client-side countdown
NEXT_PUBLIC_APPLICATIONS_CLOSE_AT=2026-05-22T23:59:59+08:00
```

## Setting up Cron Schedules

### Option A: Railway Cron (recommended)
In Railway → Service → Settings → Cron jobs, add:

```
# Reminders — every 6 hours
0 */6 * * *
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://awards.elev8-suite.com/api/cron/reminders

# Daily snapshot — 03:00 WITA daily (= 19:00 UTC previous day)
0 19 * * *
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://awards.elev8-suite.com/api/cron/snapshot
```

### Option B: External Cron (e.g., cron-job.org, EasyCron)
Same endpoints, same auth — just set up two scheduled HTTP requests.

### Option C: Supabase Edge Function (alternative)
You can also call `capture_daily_snapshot()` directly via Supabase pg_cron extension if preferred.

## New Meta WhatsApp Templates to Submit

In addition to the templates from Steps 2-3, submit these:

5. **`award_submission_reminder`** (en + id)
   - Variables: applicant name, hours left, continue URL
6. **`award_share_reminder`** (en + id)
   - Variables: applicant name, vote count, public URL
7. **`award_shortlist_notification`** (en + id)
   - Variables: applicant name, category
8. **`award_winner_notification`** (en + id)
   - Variables: applicant name, category, public URL

All messages have text fallbacks if templates aren't approved yet.

## How Referrer Attribution Works

Example flow:
1. Maya submits her application → her public page is `/v/maya-bali-villas`
2. She shares: `https://awards.elev8-suite.com/v/maya-bali-villas?ref=maya-bali-villas`
3. (Wait — that doesn't help her since she's the source)
4. **Better example**: Maya shares on her LinkedIn. Hendra clicks, lands on Maya's page, votes for Maya. → Standard vote, no attribution needed (Maya gets credit because it's her page).
5. **The attribution use case**: Hendra is impressed. He shares Maya's page with his network with `?ref=hendras-villas` (his own slug, if he's also an applicant). Now if 5 people vote for Maya via Hendra's share link, those 5 votes are attributed to Hendra in `votes_driven_to_others`.
6. Admin can see in analytics: "Hendra is driving the most awards-wide engagement."

This rewards "ambassadors" who share other people's pages — building cross-applicant solidarity which is good for the community brand.

## File Count
**74 files** total (Step 1 + 2 + 3 + 4).

## What's Still Optional (Step 5)

- [ ] Real CHA logo SVG file (current is hand-recreated)
- [ ] Image optimization in OG generator (CDN delivery for hero photos)
- [ ] Fingerprint-based dupe vote detection (currently IP-hash only)
- [ ] Email inbox in admin (parallel to WhatsApp inbox)
- [ ] Dashboard chart export to PDF for sponsor reports
- [ ] Webhook for Meta Business Account opt-out events
- [ ] Captcha on apply form (low priority — WhatsApp OTP already prevents spam votes)
