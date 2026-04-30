'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

/**
 * useLiveVoteCount — subscribes to vote_events for an application
 * Returns current count + a "just incremented" flag for animation
 */
export function useLiveVoteCount(applicationId: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(`votes:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vote_events',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_verified) {
            setCount((c) => c + 1);
            triggerPulse();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vote_events',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          // OTP verified → vote becomes verified
          if (
            payload.new &&
            (payload.new as any).is_verified &&
            payload.old &&
            !(payload.old as any).is_verified
          ) {
            setCount((c) => c + 1);
            triggerPulse();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };

    function triggerPulse() {
      setPulse(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setPulse(false), 1500);
    }
  }, [applicationId]);

  return { count, pulse };
}

interface AnimatedVoteCountProps {
  applicationId: string;
  initialCount: number;
  className?: string;
}

export function AnimatedVoteCount({
  applicationId,
  initialCount,
  className = '',
}: AnimatedVoteCountProps) {
  const { count, pulse } = useLiveVoteCount(applicationId, initialCount);

  return (
    <span
      className={`inline-block transition-all duration-500 ${
        pulse ? 'scale-125' : 'scale-100'
      } ${className}`}
      style={{
        textShadow: pulse ? '0 0 20px rgba(232, 169, 60, 0.6)' : 'none',
      }}
    >
      {count}
    </span>
  );
}
