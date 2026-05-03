import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UsersClient } from '@/components/admin/UsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  // Verify caller is admin
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabaseAdmin
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return (
      <div className="px-6 py-8 md:px-10">
        <h1 className="mb-2 font-serif text-3xl text-navy">Users</h1>
        <p className="rounded-xl border border-burgundy/20 bg-burgundy/5 p-4 text-sm text-burgundy">
          Only admins can manage users. Your role: <strong>{me?.role || 'unknown'}</strong>.
        </p>
      </div>
    );
  }

  // Load users list
  const { data: users } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, full_name, role, organization, jury_seat_color, is_active, created_at')
    .order('created_at', { ascending: false });

  return <UsersClient initialUsers={users || []} currentUserId={me.id} />;
}
