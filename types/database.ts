// ============================================================================
// Database Types — auto-mirror of Supabase schema
// Regenerate with: npx supabase gen types typescript --project-id YOUR_ID
// ============================================================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'shortlisted'
  | 'finalist'
  | 'winner'
  | 'rejected';

export type ApplicationCategory = 'boutique' | 'growing' | 'scaled';

export type ApplicationMode = 'quick' | 'deep';

export type WhatsappDirection = 'inbound' | 'outbound';

export type WhatsappStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type AdminRole = 'jury' | 'admin' | 'viewer';

export type JurySeatColor = 'coral' | 'teal' | 'burgundy' | 'gold';

// ----------------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------------

export interface Application {
  id: string;
  continue_token: string;

  mode: ApplicationMode;
  status: ApplicationStatus;

  // Step 1
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  location: string | null;
  attending_villa_connect: 'yes' | 'no' | 'maybe' | null;

  // Step 2
  villa_count: number | null;
  category: ApplicationCategory | null;
  years_hosting: number | null;
  team_size: number | null;
  occupancy_pct: number | null;
  channels: string[];

  // Step 3
  current_tools: string | null;
  current_tools_pros: string | null;
  current_tools_cons: string | null;

  // Step 4 (deep mode)
  biggest_headache: string | null;
  first_attack: string | null;
  twelve_month_vision: string | null;
  why_you: string | null;

  // Step 5
  video_pitch_url: string | null;
  hero_photo_url: string | null;
  hero_photo_path: string | null;
  share_voice_message_url: string | null;
  share_voice_path: string | null;
  short_pitch: string | null;
  willing_for_case_study: boolean;
  consent_to_publish_name: boolean;

  // Meta
  language: 'en' | 'id';
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  shortlisted_at: string | null;
  finalist_at: string | null;
  winner_at: string | null;
}

// ----------------------------------------------------------------------------
// Admin User
// ----------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  organization: string | null;
  jury_seat_color: JurySeatColor | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Jury Score
// ----------------------------------------------------------------------------

export interface JuryScore {
  id: string;
  application_id: string;
  juror_id: string;
  story_score: number | null;
  growth_potential_score: number | null;
  jury_notes: string | null;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Community Vote
// ----------------------------------------------------------------------------

export interface CommunityVote {
  id: string;
  application_id: string;
  voter_whatsapp: string;
  voter_name: string | null;
  voter_ip_hash: string | null;
  is_cha_member: boolean;
  verified_at: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// WhatsApp Message
// ----------------------------------------------------------------------------

export interface WhatsappMessage {
  id: string;
  wa_message_id: string | null;
  wa_conversation_id: string | null;
  phone_number: string;
  direction: WhatsappDirection;
  status: WhatsappStatus;
  message_type: 'text' | 'template' | 'image' | 'video';
  body: string | null;
  template_name: string | null;
  template_variables: Record<string, unknown> | null;
  media_url: string | null;
  application_id: string | null;
  sent_by_admin_id: string | null;
  raw_payload: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

// ----------------------------------------------------------------------------
// View: Application Score Summary
// ----------------------------------------------------------------------------

export interface ApplicationScoreSummary {
  application_id: string;
  full_name: string | null;
  business_name: string | null;
  category: ApplicationCategory | null;
  status: ApplicationStatus;
  juror_count: number;
  avg_story: number | null;
  avg_growth: number | null;
  jury_weighted_score: number | null;
  community_vote_count: number;
}

// ----------------------------------------------------------------------------
// Public Stats (for landing page live counter)
// ----------------------------------------------------------------------------

export interface PublicApplicationStats {
  total_submitted: number;
  boutique_count: number;
  growing_count: number;
  scaled_count: number;
}
