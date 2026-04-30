// ============================================================================
// Zod Validation Schemas — single source of truth for form + API
// ============================================================================

import { z } from 'zod';

// ----------------------------------------------------------------------------
// Step 1 — Basics (always required)
// ----------------------------------------------------------------------------

export const step1Schema = z.object({
  full_name: z.string().min(2, 'Please enter your full name').max(100),
  business_name: z.string().min(2, 'Please enter your business name').max(150),
  email: z.string().email('Please enter a valid email'),
  whatsapp: z
    .string()
    .min(8, 'Please enter your WhatsApp number')
    .regex(/^\+?[0-9\s-]+$/, 'Only digits, spaces, +, and hyphens'),
  location: z.string().min(2).max(100),
  attending_villa_connect: z.enum(['yes', 'no', 'maybe']),
});

// ----------------------------------------------------------------------------
// Step 2 — Business in Numbers
// ----------------------------------------------------------------------------

export const step2Schema = z.object({
  villa_count: z
    .number()
    .int()
    .min(1, 'Must be at least 1')
    .max(500, 'Please contact us for portfolios > 500'),
  years_hosting: z.number().int().min(0).max(50),
  team_size: z.number().int().min(0).max(500),
  occupancy_pct: z.number().int().min(0).max(100).optional(),
  channels: z
    .array(z.enum(['airbnb', 'booking', 'agoda', 'direct', 'vrbo', 'other']))
    .min(1, 'Select at least one channel'),
});

// ----------------------------------------------------------------------------
// Step 3 — Current Setup
// ----------------------------------------------------------------------------

export const step3Schema = z.object({
  current_tools: z.string().min(1).max(500),
  current_tools_pros: z.string().max(500).optional(),
  current_tools_cons: z.string().max(500).optional(),
});

// ----------------------------------------------------------------------------
// Step 4 — The Story (deep mode only)
// ----------------------------------------------------------------------------

export const step4Schema = z.object({
  biggest_headache: z.string().min(20, 'A bit more detail helps us').max(500),
  first_attack: z.string().min(20).max(500),
  twelve_month_vision: z.string().max(500).optional(),
  why_you: z.string().min(50, 'Make your case').max(1000),
});

// ----------------------------------------------------------------------------
// Step 5 — Optional
// ----------------------------------------------------------------------------

export const step5Schema = z.object({
  video_pitch_url: z.string().url().optional().or(z.literal('')),
  willing_for_case_study: z.boolean(),
  consent_to_publish_name: z.boolean(),
});

// ----------------------------------------------------------------------------
// Quick Apply — only Step 1 + Step 2 essential fields
// ----------------------------------------------------------------------------

export const quickApplySchema = step1Schema.merge(
  step2Schema.pick({ villa_count: true, channels: true })
);

// ----------------------------------------------------------------------------
// Full Deep Story — all steps
// ----------------------------------------------------------------------------

export const deepApplySchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

// ----------------------------------------------------------------------------
// Continue Token Lookup
// ----------------------------------------------------------------------------

export const continueTokenSchema = z.object({
  token: z
    .string()
    .min(20)
    .max(40)
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
});

// ----------------------------------------------------------------------------
// Jury Score Submission
// ----------------------------------------------------------------------------

export const juryScoreSchema = z.object({
  application_id: z.string().uuid(),
  story_score: z.number().int().min(0).max(10),
  growth_potential_score: z.number().int().min(0).max(10),
  jury_notes: z.string().max(2000).optional(),
});

// ----------------------------------------------------------------------------
// Community Vote
// ----------------------------------------------------------------------------

export const communityVoteSchema = z.object({
  application_id: z.string().uuid(),
  voter_whatsapp: z.string().min(8).regex(/^\+?[0-9\s-]+$/),
  voter_name: z.string().min(2).max(100).optional(),
});

// ----------------------------------------------------------------------------
// Helper types
// ----------------------------------------------------------------------------

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type QuickApplyData = z.infer<typeof quickApplySchema>;
export type DeepApplyData = z.infer<typeof deepApplySchema>;
export type JuryScoreData = z.infer<typeof juryScoreSchema>;
export type CommunityVoteData = z.infer<typeof communityVoteSchema>;
