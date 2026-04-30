import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('public_application_stats')
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { total_submitted: 0, boutique_count: 0, growing_count: 0, scaled_count: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json(
      { total_submitted: 0, boutique_count: 0, growing_count: 0, scaled_count: 0 },
      { status: 200 }
    );
  }
}
