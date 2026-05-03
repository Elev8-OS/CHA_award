import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { AdminSignOut } from '@/components/admin/AdminSignOut';
import { getSupabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const SEAT_COLORS: Record<string, { bg: string; text: string }> = {
  coral: { bg: 'bg-coral', text: 'text-white' },
  teal: { bg: 'bg-teal', text: 'text-white' },
  burgundy: { bg: 'bg-burgundy', text: 'text-white' },
  gold: { bg: 'bg-gold', text: 'text-navy' },
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  jury: 'Jury',
  viewer: 'Viewer',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-coral/15 text-coral',
  jury: 'bg-teal/15 text-teal',
  viewer: 'bg-warm-gray/15 text-warm-gray',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve current user info
  let me: {
    full_name: string;
    email: string;
    role: string;
    organization: string | null;
    jury_seat_color: string | null;
  } | null = null;

  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: row } = await supabaseAdmin
        .from('admin_users')
        .select('full_name, email, role, organization, jury_seat_color')
        .eq('id', user.id)
        .maybeSingle();
      if (row) me = row;
    }
  } catch (err) {
    console.error('[layout] Failed to resolve user:', err);
  }

  const initials = me?.full_name
    ? me.full_name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const seatColor = me?.jury_seat_color
    ? SEAT_COLORS[me.jury_seat_color] || SEAT_COLORS.coral
    : { bg: 'bg-warm-gray', text: 'text-white' };

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-line bg-white md:flex">
        <Link
          href="/admin"
          className="flex items-center gap-3 border-b border-line px-6 py-5"
        >
          <CHALogo size={44} />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-extrabold tracking-wider text-navy">
              CHA AWARDS
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
              Admin · 2026
            </span>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-5">
          <NavLink href="/admin" icon="📊" label="Dashboard" />
          <NavLink href="/admin/applications" icon="📋" label="Applications" />
          <NavLink href="/admin/jury" icon="⚖️" label="Jury Scoring" />
          <NavLink href="/admin/finalists" icon="🏆" label="Finalists" />
          <NavLink href="/admin/whatsapp" icon="💬" label="WhatsApp" />
          <NavLink href="/admin/analytics" icon="📈" label="Analytics" />
          <NavLink href="/admin/users" icon="👥" label="Users" />
        </nav>

        {/* User info block */}
        {me && (
          <div className="border-t border-line px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${seatColor.bg} ${seatColor.text}`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-navy">
                  {me.full_name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${ROLE_BADGE[me.role] || ROLE_BADGE.viewer}`}
                  >
                    {ROLE_LABEL[me.role] || me.role}
                  </span>
                  {me.organization && (
                    <span className="truncate text-[10px] text-warm-gray">
                      {me.organization}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <AdminSignOut />
          </div>
        )}
        {!me && (
          <div className="border-t border-line px-4 py-4">
            <AdminSignOut />
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy/75 transition-colors hover:bg-cream hover:text-navy"
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}
