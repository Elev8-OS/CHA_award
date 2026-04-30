// ============================================================================
// GET/POST /api/cron/snapshot
// Auth: Bearer CRON_SECRET
// Captures daily KPI snapshot for time-series analytics
// Schedule: once per day, e.g. 03:00 WITA — `0 19 * * *` (UTC = 03:00 next day WITA)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyCronAuth(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

async function handle(req: NextRequest) {
  const startedAt = Date.now();

  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin.rpc('capture_daily_snapshot');
    if (error) throw error;

    await supabaseAdmin.from('cron_runs').insert({
      job_name: 'daily_snapshot',
      status: 'success',
      records_processed: 1,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await supabaseAdmin.from('cron_runs').insert({
      job_name: 'daily_snapshot',
      status: 'failed',
      records_processed: 0,
      duration_ms: Date.now() - startedAt,
      error_message: error.message || String(error),
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
