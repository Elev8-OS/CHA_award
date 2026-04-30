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

const SYSTEM_PROMPT = `You are a pre-screening assistant for the Canggu Host Awards 2026, an annual award recognizing villa operators in Bali.

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
  "category_fit": "strong" | "borderline" | "weak"
}

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
    console.log('ANTHROPIC_API_KEY not set, skipping AI assessment');
    return null;
  }

  const userPrompt = buildUserPrompt(app);
  const model = process.env.ANTHROPIC_ASSESSMENT_MODEL || DEFAULT_MODEL;

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
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Anthropic API error:', res.status, errorBody);
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      console.error('Anthropic API: no text in response');
      return null;
    }

    // Parse JSON — be tolerant of code-fence wrapping
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const assessment = JSON.parse(cleaned) as ApplicationAssessment;

    // Validate ranges
    assessment.story_score = clamp(Math.round(assessment.story_score || 0), 0, 10);
    assessment.growth_score = clamp(Math.round(assessment.growth_score || 0), 0, 10);

    return assessment;
  } catch (error: any) {
    console.error('AI assessment failed:', error.message);
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
    lines.push(`## First attack with elev8`, app.first_attack, '');
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
