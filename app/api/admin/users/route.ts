// ============================================================================
// /api/admin/users
// GET    — List all admin/jury/viewer users
// POST   — Create new admin user (auth user + admin_users in one flow,
//          UUIDs synced)
// DELETE — Soft-delete (deactivate) admin user
//
// Auth: Caller must be an active admin in admin_users.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import { sendAdminWelcomeEmail } from '@/lib/email/resend';

const VALID_ROLES = ['admin', 'jury', 'viewer'] as const;
const VALID_COLORS = ['coral', 'teal', 'burgundy', 'gold'] as const;

// ---------- Auth helper ----------
async function requireAdmin() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401 as const };

  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active, full_name')
    .eq('id', user.id)
    .single();

  if (!admin || !admin.is_active) {
    return { error: 'Not an admin', status: 403 as const };
  }
  if (admin.role !== 'admin') {
    return { error: 'Admin role required', status: 403 as const };
  }
  return { admin };
}

// ---------- GET: list users ----------
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, full_name, role, organization, jury_seat_color, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

// ---------- POST: create user ----------
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, full_name, role, organization, jury_seat_color } = body;

  // Validate
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!full_name || typeof full_name !== 'string' || full_name.length < 2) {
    return NextResponse.json({ error: 'Full name required' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role (admin/jury/viewer)' }, { status: 400 });
  }
  if (jury_seat_color && !VALID_COLORS.includes(jury_seat_color)) {
    return NextResponse.json({ error: 'Invalid jury seat color' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `User with email ${normalizedEmail} already exists` },
      { status: 409 }
    );
  }

  // ---------- Step 1: Create Supabase Auth user ----------
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true, // Auto-confirm so they can log in immediately via OTP
  });

  if (authError || !authData?.user) {
    console.error('[ADMIN-USERS] Auth user creation failed:', authError);
    return NextResponse.json(
      { error: `Failed to create auth user: ${authError?.message || 'unknown'}` },
      { status: 500 }
    );
  }

  const authUserId = authData.user.id;

  // ---------- Step 2: Create admin_users row with SAME UUID ----------
  const { data: adminRow, error: insertError } = await supabaseAdmin
    .from('admin_users')
    .insert({
      id: authUserId, // Sync UUID with auth.users
      email: normalizedEmail,
      full_name: full_name.trim(),
      role,
      organization: organization?.trim() || null,
      jury_seat_color: jury_seat_color || null,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    // Rollback: delete the auth user since admin_users insert failed
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    console.error('[ADMIN-USERS] admin_users insert failed:', insertError);
    return NextResponse.json(
      { error: `Failed to create admin user: ${insertError.message}` },
      { status: 500 }
    );
  }

  console.log(
    `[ADMIN-USERS] Created user: ${normalizedEmail} (role=${role}, id=${authUserId})`
  );

  // ---------- Step 3: Send welcome email (best-effort, non-blocking) ----------
  let welcomeSent = false;
  try {
    await sendAdminWelcomeEmail({
      to: normalizedEmail,
      fullName: full_name.trim(),
      role,
      organization: organization?.trim() || null,
      invitedBy: auth.admin.full_name || 'The CHA Awards team',
    });
    welcomeSent = true;
    console.log(`[ADMIN-USERS] Welcome email sent to ${normalizedEmail}`);
  } catch (emailErr: any) {
    // Don't fail the whole operation — user is created, email can be re-sent later
    console.error(`[ADMIN-USERS] Welcome email failed:`, emailErr?.message);
  }

  return NextResponse.json({ ok: true, user: adminRow, welcomeSent });
}

// ---------- DELETE: deactivate user ----------
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Don't allow deleting yourself
  if (userId === auth.admin.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  // Soft-delete via is_active flag (don't lose scoring history)
  const { error: updateError } = await supabaseAdmin
    .from('admin_users')
    .update({ is_active: false })
    .eq('id', userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Also delete auth user so they can't log in anymore
  await supabaseAdmin.auth.admin.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
