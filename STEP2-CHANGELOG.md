# Step 2 — What's New

This builds on Step 1 (repo + DB schema). All public-facing pages, the application flow, public applicant pages with voting, and the admin dashboard are now in place.

## What was added

### Database
- **Migration 02** (`20260501000001_public_pages_and_voting.sql`)
  - Adds `public_slug`, `is_public`, `hero_photo_url`, `short_pitch`, view/share counters to applications
  - Auto-slug generation function (handles collisions: `business-name-1`, `business-name-2`)
  - Auto-trigger on submission: status `draft` → `submitted` triggers slug + is_public=true
  - New tables: `vote_events` (with OTP verification), `page_views`, `share_events`
  - Atomic counter RPCs: `increment_view_count`, `increment_share_count`
  - PII-safe view: `public_applicant_view` (only exposes consented data)
  - Live ranking view: `category_leaderboard`

### Public Pages
- **Landing** (`app/page.tsx`) — full Next.js port of the v3 design, bilingual EN/ID, live application counter
- **Apply chooser** (`app/apply/page.tsx`) — Quick Apply (3 min) vs Deep Story (12 min)
- **Multi-step form** (`app/apply/[token]/page.tsx`) — 3 or 5 steps depending on mode, auto-save, bilingual, mobile-first
- **Thank-you page** (`app/apply/thank-you/page.tsx`) — confirmation + share buttons + next steps
- **Public applicant page** (`app/v/[slug]/page.tsx`) — **THE VIRAL HOOK**:
  - Mobile-optimized hero with category color gradient
  - Avatar (photo or initials), business name, location, stats row
  - Prominent voting block with live count and category rank
  - 3 share methods: WhatsApp pre-filled, LinkedIn, Copy Link
  - Story cards (4 colors) showing applicant's answers
  - WhatsApp OTP voting modal with 6-digit verification
  - Anti-abuse: IP hash + fingerprint + duplicate prevention
  - Dynamic OG image per applicant
- **Finalists page** (`app/finalists/page.tsx`) — locked until 25 May, then top 5 per category
- **Winners page** (`app/winners/page.tsx`) — locked until 27 May, then 3 winners

### Admin Dashboard (auth-protected)
- **Magic link login** (`app/(admin)/login/page.tsx`)
- **Applications list** (`app/(admin)/admin/applications/page.tsx`) with stats, vote counts, view/share metrics
- **Application detail** (`app/(admin)/admin/applications/[id]/page.tsx`) with full story, business numbers, scoring panel
- **Scoring panel** — 0-10 sliders for Story (50%) and Growth (30%), private notes, see other jurors' scores with seat colors
- **Jury overview** (`app/(admin)/admin/jury/page.tsx`) — per-juror progress dashboard
- **WhatsApp inbox** (`app/(admin)/admin/whatsapp/page.tsx`) — conversation list, thread view, send replies
- **Analytics** (`app/(admin)/admin/analytics/page.tsx`) — funnel, top performers, share channel breakdown

### API Routes
| Route | Purpose |
|-------|---------|
| `GET /api/stats` | Public application count for landing page |
| `POST /api/applications` | Create draft, return continue_token |
| `PATCH /api/applications` | Update draft (auto-save) |
| `GET /api/applications?token=...` | Fetch draft by token |
| `POST /api/applications/[id]/submit` | Finalize, send email + WhatsApp |
| `POST /api/votes/request-otp` | Generate 6-digit OTP, send via WhatsApp template |
| `POST /api/votes/verify` | Verify OTP within 10 min, finalize vote |
| `POST /api/track/share` | Log share events, increment counter |
| `POST /api/admin/whatsapp/send` | Admin-only outbound WhatsApp |
| `GET /api/webhooks/whatsapp` | Meta verification handshake |
| `POST /api/webhooks/whatsapp` | Inbox + status updates from Meta |
| `GET /api/og/applicant/[slug]` | Dynamic OG image for share previews |

### Libraries
- `lib/whatsapp/client.ts` — Meta Cloud API wrapper (sendText, sendTemplate, verifyWebhookSignature)
- `lib/whatsapp/templates.ts` — sendApplicationConfirmation, sendVotingOtp, sendFinalistNotification (bilingual EN/ID)
- `lib/email/resend.ts` — sendApplicationConfirmationEmail, sendSaveContinueEmail (bilingual HTML)
- `lib/i18n/translations.ts` — EN/ID dictionary
- `lib/utils.ts` — cn, hashIP, normalizePhoneNumber (Indonesia +62), getInitials, share URL helpers

## Setup Additions

### Required Meta WhatsApp Templates
Submit these in Meta Business Manager (24-48h approval):

1. **`award_application_received`** (en + id)
   - Body: `Hi {{1}}, your application is received. Your public page: {{2}}`
   - Variables: applicant name, public URL

2. **`award_voting_otp`** (en + id)
   - Body: `Your CHA Awards vote code for {{2}} is *{{1}}*. Valid 10 min.`
   - Variables: OTP code, applicant name
   - **Category: AUTHENTICATION** (faster approval, higher delivery)

3. **`award_finalist_notification`** (en + id)
   - Body: `{{1}}, you're a Top 5 finalist in {{2}} category! Your page: {{3}}`
   - Variables: applicant name, category, public URL

If templates aren't approved yet, the system **falls back to free-form text** (only valid within 24h customer service window — works during testing while applicants are actively replying).

### New Environment Variables
- `IP_HASH_SALT` — random string for hashing IPs (anti-abuse)
- `FINALISTS_REVEAL_AT=2026-05-25T18:00:00+08:00`
- `WINNERS_REVEAL_AT=2026-05-26T15:00:00+08:00`

### Run Migration 02
After Migration 01 is applied:
```sql
-- Open Supabase SQL Editor, paste contents of:
-- supabase/migrations/20260501000001_public_pages_and_voting.sql
```

### Test the Voting Flow
1. Create an application via `/apply` (quick mode is fastest)
2. Submit it — confirmation email + WhatsApp sent
3. Visit `/v/[your-slug]` — see your public page
4. Click "Cast your vote" — enter another phone number — receive OTP
5. Verify OTP — vote counts go up

### Test the OG Image
Open `/api/og/applicant/[slug]` directly in a browser. Should render a 1200x630 PNG with applicant info.

Test the share preview by pasting `https://awards.elev8-suite.com/v/[slug]` into:
- WhatsApp (rich preview should show)
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## What's Still TODO

- [ ] **Real CHA logo SVG** — current is a hand-recreated reconstruction (4 hearts placeholder)
- [ ] **Jury headshots** — currently using initials with gradients
- [ ] **Status transitions** — admin UI to mark `shortlisted` / `finalist` / `winner`
- [ ] **Bulk WhatsApp sends** — for shortlist/finalist announcements
- [ ] **Reminder cron** — auto-send "24h until deadline" reminders
- [ ] **Image upload** — for hero_photo_url (currently only URL string)
- [ ] **Admin endpoints** for state transitions (status changes)

## Key Decisions

### Why WhatsApp OTP for voting?
- **Anti-fraud**: Without verification, anyone can spam votes
- **Network effect**: Voters are now reachable for future awards
- **Trust signal**: Communicates "real votes, real verification"
- **Localization**: WhatsApp is the dominant channel in Indonesia

### Why slug-based URLs (`/v/maya-bali-villas`) not random tokens?
- **Memorable**: applicants can say "go to awards-link/v/maya-bali-villas"
- **Brand-aligned**: their business name in their share URL
- **SEO-friendly**: indexable on Google
- Trade-off: name collisions handled with `-1`, `-2` suffix

### Why bilingual everywhere?
- 50%+ of CHA members are Indonesian
- Form language sticks → confirmation email + WhatsApp comes back in same language
- Public applicant page localizes based on visitor preference (toggle + localStorage)

### Why Meta Cloud API not Twilio?
- Templates are free (vs Twilio per-message fees)
- Free 1000 conversations/month from Meta
- No third-party in the chain
- Direct integration with Meta Business

## File Count
**66 files** total in this build (Step 1 + Step 2).
