'use client';

import { useState } from 'react';

type Role = 'admin' | 'jury' | 'viewer';
type SeatColor = 'coral' | 'teal' | 'burgundy' | 'gold';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  organization: string | null;
  jury_seat_color: SeatColor | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialUsers: User[];
  currentUserId: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin (full access)',
  jury: 'Jury (scoring access)',
  viewer: 'Viewer (read-only)',
};

const COLOR_HEX: Record<SeatColor, string> = {
  coral: '#D4663F',
  teal: '#1F8A7A',
  burgundy: '#7A2935',
  gold: '#E8A93C',
};

export function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('jury');
  const [organization, setOrganization] = useState('');
  const [seatColor, setSeatColor] = useState<SeatColor | ''>('');

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('jury');
    setOrganization('');
    setSeatColor('');
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          organization: organization || null,
          jury_seat_color: seatColor || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Add to list
      setUsers((u) => [data.user, ...u]);
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will no longer be able to sign in.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, is_active: false } : x)));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-navy">Users</h1>
          <p className="text-sm text-warm-gray">
            Manage admin, jury, and viewer access. New users get auto-confirmed and can sign in immediately via OTP.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-burgundy"
          >
            + Add user
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-2xl border border-line bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-navy">New user</h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-sm text-warm-gray hover:text-navy"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Reto Wyss"
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
              >
                <option value="admin">Admin (full access)</option>
                <option value="jury">Jury (scoring access)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-navy">
                Organization{' '}
                <span className="font-normal text-warm-gray">(optional)</span>
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Elev8 Suite OS"
                className="w-full rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-navy">
                Jury seat color{' '}
                <span className="font-normal text-warm-gray">(optional, only for jury)</span>
              </label>
              <div className="flex gap-2">
                {(['coral', 'teal', 'burgundy', 'gold'] as SeatColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSeatColor(seatColor === c ? '' : c)}
                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-bold capitalize transition-all ${
                      seatColor === c
                        ? 'border-navy text-white'
                        : 'border-line bg-white text-navy/60 hover:border-navy/30'
                    }`}
                    style={
                      seatColor === c
                        ? { background: COLOR_HEX[c] }
                        : { borderLeftColor: COLOR_HEX[c], borderLeftWidth: '4px' }
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <div className="md:col-span-2">
                <p className="rounded-xl border border-burgundy/20 bg-burgundy/5 p-3 text-sm text-burgundy">
                  ⚠ {formError}
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting || !email || !fullName}
                className="w-full rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition-all hover:bg-burgundy disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create user →'}
              </button>
              <p className="mt-3 text-center text-[11px] text-warm-gray">
                User will be auto-confirmed and can sign in immediately at /login.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-cream/50">
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Name
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Email
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Role
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Organization
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Status
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-warm-gray">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-line/50 last:border-0 ${u.is_active ? '' : 'opacity-50'}`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    {u.jury_seat_color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ background: COLOR_HEX[u.jury_seat_color] }}
                        title={u.jury_seat_color}
                      />
                    )}
                    <span className="text-sm font-semibold text-navy">{u.full_name}</span>
                    {u.id === currentUserId && (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-warm-gray">
                        you
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-navy/75">{u.email}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                      u.role === 'admin'
                        ? 'bg-coral/15 text-coral'
                        : u.role === 'jury'
                        ? 'bg-teal/15 text-teal'
                        : 'bg-warm-gray/15 text-warm-gray'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-navy/75">{u.organization || '—'}</td>
                <td className="px-5 py-4">
                  {u.is_active ? (
                    <span className="text-xs font-bold text-teal">● Active</span>
                  ) : (
                    <span className="text-xs font-bold text-warm-gray">● Inactive</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  {u.is_active && u.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(u.id, u.full_name)}
                      className="text-xs font-semibold text-burgundy hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-warm-gray">
                  No users yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
