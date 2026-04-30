# Step 3 — What's New

Building on Steps 1+2, this adds **photo uploads, voice messages, status transitions, and bulk WhatsApp notifications**.

## What was added

### 1. Photo Upload (Supabase Storage)
- **Migration 03** (`20260501000002_storage_buckets.sql`)
  - Creates `applicant-photos` bucket (5MB limit, JPEG/PNG/WebP/HEIC)
  - Creates `applicant-voice` bucket (3MB limit, ~30s audio)
  - Public-read RLS, service-role-only writes (we proxy via API)
  - Adds `hero_photo_path` and `share_voice_path` columns
  - Updates `public_applicant_view` to expose voice URL
- **`/api/upload/photo`** (POST + DELETE) — token-validated upload endpoint
- **`PhotoUpload.tsx`** — drag-drop component with preview, removal
- Integrated into **Quick Apply Step 3** and **Deep Story Step 5**
- OG image route now uses real photo when available

### 2. Voice Message Recorder
- **`/api/upload/voice`** (POST + DELETE)
- **`VoiceRecorder.tsx`** — uses browser `MediaRecorder` API
  - 30-second hard limit with progress bar
  - Mime type negotiation (webm/opus, mp4, ogg)
  - Preview before upload, re-record option
  - Microphone permission handling
- Voice plea displays prominently on **public applicant page** above share buttons
- Optional — only shown in Deep Story mode (Step 5)

### 3. Admin Status Transitions
- **`/api/admin/applications/[id]/status`** (PATCH)
  - Roles: `submitted` → `shortlisted` → `finalist` → `winner` (or `rejected`)
  - Auto-sets timestamp columns (`shortlisted_at`, `finalist_at`, `winner_at`)
  - Optional WhatsApp notification trigger
- **`StatusTransition.tsx`** — dropdown with notification opt-in
- Integrated into **application detail page** (replaces static status badge)
- New **Timeline** card shows all status timestamps

### 4. Bulk Notifications & Finalists Page
- **`/admin/finalists`** — dedicated page for finalist selection
- **`FinalistsManager.tsx`**:
  - All applicants grouped by category (Boutique/Growing/Scaled)
  - Click-to-select interface, sticky action bar
  - Shows vote count + jury weighted score per applicant
  - **"Mark as Finalists"** — bulk status update
  - **"Bulk Notify"** — confirmation modal, bulk WhatsApp template send
  - Real-time success/failure reporting
- **`/api/admin/whatsapp/bulk`** (POST)
  - Templates: `finalist_notification`, `application_confirmation`, `custom`
  - Sends in parallel, returns succeeded/failed counts
  - Up to 100 recipients per call
- Added **Finalists** to admin sidebar

## Database Migrations to Run (in order)

```bash
# In Supabase SQL Editor:
1. supabase/migrations/20260501000000_initial_schema.sql       # Step 1
2. supabase/migrations/20260501000001_public_pages_and_voting.sql # Step 2
3. supabase/migrations/20260501000002_storage_buckets.sql      # Step 3 (NEW)
```

Migration 03 creates two storage buckets. They will appear in your Supabase dashboard under **Storage**. They're public-read so the URLs work directly in browsers.

## How Photo Upload Works

1. User clicks photo upload in form Step 5 (Deep) or Step 3 (Quick)
2. Browser sends file to `/api/upload/photo` with `continue_token` from form
3. Server validates token → uploads to Supabase Storage with path `{app_id}/hero-{timestamp}.{ext}`
4. Updates application's `hero_photo_url` and `hero_photo_path`
5. Old photo (if any) is deleted from storage
6. Public page + OG image start using the new photo immediately

## How Voice Recording Works

1. User clicks "Start recording" — browser asks for mic permission
2. `MediaRecorder` captures audio, max 30s with auto-stop
3. User reviews preview, can re-record
4. On confirm: uploaded to `/api/upload/voice`
5. Public page shows audio player above share buttons with label "A message from {name}"

## How Status Transitions Work

In application detail (`/admin/applications/[id]`):
1. Sidebar has **Status transition** card with dropdown
2. Selecting `finalist` shows checkbox "Notify applicant via WhatsApp"
3. On Save: status updates + optional WhatsApp template send
4. Page refreshes to show new state in timeline

## How Bulk Notifications Work

In `/admin/finalists`:
1. Click applicants to select (cards highlight by category color)
2. **Mark as Finalists** — updates all selected to `finalist` status
3. **Bulk Notify** — confirmation modal → sends `award_finalist_notification` template to all selected
4. Result modal shows succeeded/failed count

The endpoint runs in parallel with `Promise.allSettled` so partial failures don't break the batch.

## Notes on WhatsApp Templates

The bulk notify uses Meta-approved templates first, with text fallback:
- `award_finalist_notification` — must be approved in Meta Business Manager
- If template not approved: falls back to `sendText` (only works in 24h customer service window)

For announcements **before** Meta approves your template:
- Use `template: 'custom'` with `custom_body` parameter
- Only works for applicants who messaged you in last 24h

For production launch (12 May), submit templates the day you get the WhatsApp number (1 May). Meta typically approves authentication templates in <24h, marketing templates in 24-48h.

## File Count
**67 files** total (Step 1 + 2 + 3).

## What's Still TODO

- [ ] Reminder cron (24h before deadline auto-send)
- [ ] Real CHA logo SVG
- [ ] Image optimization in OG image (next/image not available in Edge runtime)
- [ ] Spam/profanity filter for short_pitch
- [ ] Rate limiting on photo/voice uploads (currently only token-validated)
- [ ] Application analytics by referrer (track which shares convert)
