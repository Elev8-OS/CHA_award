import Link from 'next/link';
import { CHALogo } from '@/components/common/CHALogo';
import { AdminSignOut } from '@/components/admin/AdminSignOut';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-line bg-white md:flex">
        <Link href="/admin" className="flex items-center gap-3 border-b border-line px-6 py-5">
          <CHALogo size={32} />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-extrabold tracking-wider text-navy">CHA AWARDS</span>
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
        </nav>

        <div className="border-t border-line px-4 py-4">
          <AdminSignOut />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
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
