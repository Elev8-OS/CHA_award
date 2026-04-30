'use client';

import { useEffect, useState } from 'react';

export function LiveCount({ initial = 0, label }: { initial?: number; label: string }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setCount(data.total_submitted ?? 0);
        }
      } catch {
        // silent fail — keep initial
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-500" />
      <span>{count}</span>
    </span>
  );
}
