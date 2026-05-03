// ============================================================================
// AI Assessment — uses Anthropic Claude to pre-screen new applications
// Generates: summary, story score, growth score, recommendation, red flags
//
// Used in admin notification email — NOT shown to jury (independence is critical).
// ============================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export interface ApplicationAssessment {
  summary: string;
  story_score: number;
  growth_score: number;
  recommendation: string;
  red_flags: string | null;
  category_fit: 'strong' | 'borderline' | 'weak';
  followup_questions: FollowupQuestion[];
}

export interface FollowupQuestion {
  field: string; // form field name to focus on
  question: string; // the actual question text (English)
  question_id: string; // bilingual translation key for the question
  reason: string; // why we're asking (admin-only, not shown to applicant)
}

interface AssessmentInput {
  business_name: string;
  full_name: string;
  category: string;
  location: string | null;
  villa_count: number | null;
  years_hosting: number | null;
  team_size: number | null;
  occupancy_pct: number | null;
  channels: string[];
  short_pitch: string | null;
  current_tools: string | null;
  current_tools_pros: string | null;
  current_tools_cons: string | null;
  biggest_headache: string | null;
  first_attack: string | null;
  twelve_month_vision: string | null;
  why_you: string | null;
  mode: string;
  language: string;
}

const SYSTEM_PROMPT = `You are a pre-screening assistant for the CHA Hospitality Awards 2026, an annual award recognizing villa operators in Bali.

You receive submitted applications and produce a concise pre-assessment for the admin.

The award has three categories based on portfolio size:
- Boutique (1-3 villas) — owner-operators
- Growing (4-9 villas) — complexity threshold
- Scaled (10+ villas) — professional operators

Final scoring weights (used by HUMAN jury, not by you):
- Story (50%) — most honest, specific account of where they are
- Growth Potential (30%) — what 1 year of better tools could unlock
- Community Wildcard (20%) — set by community vote

Your job is ONLY pre-screening for the admin. Your scores are advisory, not final.

Return your assessment as a JSON object with this exact structure:
{
  "summary": "1-2 sentences capturing who they are and their main story.",
  "story_score": 0-10 integer (specificity, honesty, concrete pain points),
  "growth_score": 0-10 integer (clarity of vision, realistic ambition, potential impact of better tooling),
  "recommendation": "1-2 sentences. Direct take. Examples: 'Strong story, fast-track to shortlist.' / 'Generic answers, low priority.' / 'Borderline — review story manually.'",
  "red_flags": "Null OR a single sentence noting concerns: spam-like answers, AI-generated text, missing required info, suspicious claims. Be conservative — only flag clear issues.",
  "category_fit": "strong" | "borderline" | "weak",
  "followup_questions": [
    {
      "field": "biggest_headache" | "first_attack" | "twelve_month_vision" | "why_you" | "current_tools_pros" | "current_tools_cons" | "short_pitch",
      "question": "Direct, friendly question text in English. 1-2 sentences. Should help applicant be more specific.",
      "question_id": "Same question in Bahasa Indonesia, formal but warm.",
      "reason": "1 sentence explaining what gap this fills (admin-only, never sent to applicant)"
    }
  ]
}

Follow-up questions guidance:
- Only suggest if you'd give 7 or below in either score
- Suggest 1-3 questions max, focused on the WEAKEST areas
- Each question must point to a SPECIFIC form field they can edit
- Make questions easy to answer in 2-3 sentences (no essays)
- Tone: warm, curious, supportive — never accusatory ("Could you tell us more about..." not "You didn't explain...")
- If story_score AND growth_score are both 8+, return empty array []
- Always provide question in BOTH English (question) and Bahasa Indonesia (question_id)

Scoring guidance:
- 9-10: Exceptional — vivid specifics, mature thinking, clear differentiation
- 7-8: Strong — solid answers, real pain points, credible vision
- 5-6: Average — competent but generic, lacks specificity
- 3-4: Weak — vague, generic, low effort
- 0-2: Spam, AI-generated boilerplate, or non-serious

Only respond with the JSON object. No preamble, no markdown code fences, no explanation.`;

export async function generateApplicationAssessment(
  app: AssessmentInput
): Promise<ApplicationAssessment | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[AI] ANTHROPIC_API_KEY not set, skipping AI assessment');
    return null;
  }

  const userPrompt = buildUserPrompt(app);
  const model = process.env.ANTHROPIC_ASSESSMENT_MODEL || DEFAULT_MODEL;

  console.log(`[AI] Starting assessment with model=${model} for ${app.business_name}`);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000, // Was 800 — too low when followup_questions are added
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[AI] Anthropic API HTTP error: status=${res.status}, body=${errorBody}`);
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      console.error('[AI] Anthropic API returned no text:', JSON.stringify(data).slice(0, 500));
      return null;
    }

    // Check stop_reason — if "max_tokens", JSON is likely truncated
    const stopReason = data.stop_reason;
    if (stopReason !== 'end_turn') {
      console.warn(`[AI] Unexpected stop_reason: ${stopReason}. Response may be truncated.`);
    }

    // Parse JSON — be tolerant of code-fence wrapping
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let assessment: ApplicationAssessment;
    try {
      assessment = JSON.parse(cleaned) as ApplicationAssessment;
    } catch (parseError: any) {
      console.error(`[AI] JSON parse failed. stop_reason=${stopReason}, response_length=${text.length}`);
      console.error(`[AI] Raw response (first 300 chars): ${cleaned.slice(0, 300)}`);
      console.error(`[AI] Parse error: ${parseError.message}`);
      return null;
    }

    // Validate + sanitize
    assessment.story_score = clamp(Math.round(assessment.story_score || 0), 0, 10);
    assessment.growth_score = clamp(Math.round(assessment.growth_score || 0), 0, 10);
    assessment.summary = assessment.summary || '(no summary)';
    assessment.recommendation = assessment.recommendation || '(no recommendation)';
    assessment.category_fit = assessment.category_fit || 'borderline';

    // Default to empty array if AI omits the field
    if (!Array.isArray(assessment.followup_questions)) {
      assessment.followup_questions = [];
    }

    console.log(
      `[AI] Assessment complete: story=${assessment.story_score}/10, growth=${assessment.growth_score}/10, fit=${assessment.category_fit}, followups=${assessment.followup_questions.length}`
    );

    return assessment;
  } catch (error: any) {
    console.error('[AI] Assessment threw exception:', error?.message || error);
    console.error('[AI] Stack:', error?.stack);
    return null;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildUserPrompt(app: AssessmentInput): string {
  const lines: string[] = [
    `# Application — ${app.business_name}`,
    '',
    `**Mode:** ${app.mode === 'deep' ? 'Deep Story' : 'Quick Apply'}`,
    `**Language:** ${app.language === 'id' ? 'Bahasa Indonesia' : 'English'}`,
    `**Category:** ${app.category} (${app.villa_count} villas)`,
    `**Location:** ${app.location || '—'}`,
    `**Years hosting:** ${app.years_hosting || '—'}`,
    `**Team size:** ${app.team_size || '—'}`,
    `**Occupancy:** ${app.occupancy_pct ? `${app.occupancy_pct}%` : '—'}`,
    `**Channels:** ${(app.channels || []).join(', ') || '—'}`,
    '',
  ];

  if (app.short_pitch) {
    lines.push(`## Pitch`, app.short_pitch, '');
  }

  if (app.current_tools) {
    lines.push(`## Current tools`, app.current_tools, '');
  }
  if (app.current_tools_pros) {
    lines.push(`### What works`, app.current_tools_pros, '');
  }
  if (app.current_tools_cons) {
    lines.push(`### What doesn't`, app.current_tools_cons, '');
  }

  if (app.biggest_headache) {
    lines.push(`## Biggest operational headache`, app.biggest_headache, '');
  }
  if (app.first_attack) {
    lines.push(`## First attack with Elev8 Suite OS`, app.first_attack, '');
  }
  if (app.twelve_month_vision) {
    lines.push(`## 12-month vision`, app.twelve_month_vision, '');
  }
  if (app.why_you) {
    lines.push(`## Why them`, app.why_you, '');
  }

  lines.push('---', '', 'Produce the JSON assessment now.');

  return lines.join('\n');
}
