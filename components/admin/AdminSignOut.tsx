'use client';

import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

export function AdminSignOut() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={signOut}
      className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-cream"
    >
      Sign out
    </button>
  );
}
