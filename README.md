# CHA Hospitality Awards 2026 — Web Application

The CHA Hospitality Awards 2026 — presented by CHA, powered by elev8.

A Next.js 14 application with Supabase backend and Meta WhatsApp Cloud API integration, deployed on Railway.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS with CHA brand tokens
- **Database:** Supabase (Postgres + Auth + RLS)
- **Email:** Resend
- **WhatsApp:** Meta WhatsApp Cloud API
- **Hosting:** Railway (with GitHub auto-deploy)
- **Forms:** React Hook Form + Zod

## Project Structure

```
cha-awards/
├── app/
│   ├── (public)/            # Public-facing pages
│   │   ├── page.tsx         # Landing
│   │   ├── apply/           # Application flow
│   │   ├── finalists/       # Top 5 reveal
│   │   ├── winners/         # Hall of fame
│   │   └── vote/[token]/    # Community voting
│   ├── (admin)/             # Auth-protected admin
│   │   └── admin/
│   │       ├── applications/
│   │       ├── jury/
│   │       ├── whatsapp/
│   │       └── analytics/
│   └── api/                 # API routes
│       ├── applications/    # CRUD + submit
│       ├── webhooks/whatsapp/ # Meta webhook
│       └── send/            # Outbound WA + email
├── components/              # Reusable UI components
├── lib/
│   ├── supabase/            # DB clients (admin/server/browser)
│   ├── whatsapp/            # Meta Cloud API wrapper
│   ├── email/               # Resend templates
│   └── validations/         # Zod schemas
├── supabase/migrations/     # SQL schema migrations
├── types/                   # TypeScript types
└── public/                  # Static assets
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd cha-awards
npm install
```

### 2. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys to `.env.local`
3. Run the initial migration:
   - Open Supabase SQL Editor
   - Paste contents of `supabase/migrations/20260501000000_initial_schema.sql`
   - Run

4. Update the seed admin emails at the bottom of the migration file before running, or run the seed insert manually with real emails.

### 3. Meta WhatsApp Cloud API

This takes 2-5 days to fully approve, **start now**:

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Create a Business Account if you don't have one
3. Go to WhatsApp Manager → "Get Started"
4. Add a phone number (use a fresh number, not your personal)
5. Verify the phone number
6. Create a system user with WhatsApp permissions:
   - Business Settings → System Users → Add
   - Generate token with `whatsapp_business_messaging` and `whatsapp_business_management` scopes
7. Copy these to `.env.local`:
   - `WHATSAPP_PHONE_NUMBER_ID` (from WhatsApp Manager → Phone Numbers)
   - `WHATSAPP_BUSINESS_ACCOUNT_ID` (WABA ID)
   - `WHATSAPP_ACCESS_TOKEN` (system user permanent token)
   - `WHATSAPP_VERIFY_TOKEN` (any random string you choose)
   - `WHATSAPP_APP_SECRET` (from Meta App settings)

8. Configure webhook:
   - In Meta App settings → WhatsApp → Configuration
   - Callback URL: `https://awards.elev8-suite.com/api/webhooks/whatsapp`
   - Verify Token: same string you set in `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to fields: `messages`, `message_status`

9. Submit message templates for approval (24-48h):
   - `award_application_received`
   - `award_finalist_notification`
   - `award_winner_notification`
   - `award_reminder_24h`

### 4. Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create API key, copy to `.env.local`

### 5. Local Development

```bash
cp .env.example .env.local
# fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Railway

1. Push code to GitHub
2. In Railway: New Project → Deploy from GitHub
3. Select your repo
4. Add all environment variables from `.env.example`
5. Railway auto-deploys on every push to `main`
6. Configure custom domain `awards.elev8-suite.com`:
   - Railway → Settings → Domains
   - Add `awards.elev8-suite.com`
   - Add CNAME record pointing to your Railway domain at your DNS provider

## Database Schema Overview

| Table | Purpose |
|-------|---------|
| `applications` | All applications (draft + submitted) |
| `admin_users` | Jury members, admins, viewers |
| `jury_scores` | Per-juror scoring of applications |
| `community_votes` | WhatsApp-verified community votes |
| `whatsapp_messages` | Inbox + outbox for WA messages |
| `analytics_events` | Page views, conversion events |

## Key Routes

### Public

- `/` — Landing page
- `/apply` — Application start (Quick or Deep)
- `/apply/[token]` — Resume saved application
- `/apply/thank-you` — Submission confirmation
- `/finalists` — Top 5 reveal (live from 25 May)
- `/winners` — Hall of fame (live from 27 May)
- `/vote/[token]` — Community voting page

### Admin (auth-required)

- `/admin` — Dashboard with stats
- `/admin/applications` — List, filter, review
- `/admin/applications/[id]` — Detail + jury scoring
- `/admin/jury` — Per-juror progress overview
- `/admin/whatsapp` — Inbox + send (Meta WA frontend)
- `/admin/analytics` — Funnel + conversions

### API

- `POST /api/applications` — Create draft
- `PATCH /api/applications/[id]` — Update (with continue token)
- `POST /api/applications/[id]/submit` — Finalize submission
- `POST /api/jury-scores` — Submit jury scoring
- `POST /api/votes` — Submit community vote
- `POST /api/send/whatsapp` — Outbound WA message
- `POST /api/webhooks/whatsapp` — Meta WA webhook (inbox + status)
- `GET /api/stats` — Public stats for landing page

## Timeline & Launch

| Date | Action |
|------|--------|
| 1 — 11 May | Build, test, content review |
| 12 May | **Launch** — applications open |
| 22 May, 23:59 WITA | Submissions close |
| 23 — 24 May | Jury scoring window |
| 25 May | Top 5 finalists revealed |
| 26 — 27 May | **Live stage reveal** at Villa Connect |

## Build Sequence

This project is built in modular steps. Current status:

- [x] **Step 1:** Repo setup + DB schema + types
- [ ] **Step 2:** Application flow (Quick + Deep)
- [ ] **Step 3:** Email confirmation + Resend integration
- [ ] **Step 4:** Admin dashboard
- [ ] **Step 5:** WhatsApp integration (webhook + outbound)
- [ ] **Step 6:** Finalists/Winners pages
- [ ] **Step 7:** Railway deployment + custom domain
- [ ] **Step 8:** Analytics + final QA

## License

Private. © 2026 elev8 / Canggu Hospitality Association.
