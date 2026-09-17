'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { dayKey } from '@/lib/domain/mood';

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 30000);
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('pageshow', onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('pageshow', onChange);
  };
}
export function useLocalDay(timezone: string, initialNow: string) {
  const getSnapshot = useCallback(() => dayKey(new Date(), timezone), [timezone]);
  const getServerSnapshot = useCallback(() => dayKey(initialNow, timezone), [initialNow, timezone]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
