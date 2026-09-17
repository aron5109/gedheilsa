'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api, storageConsent } from '@/lib/client';
import { enqueue, pending, acknowledge } from '@/lib/outbox';
import type { AppData, MoodEntry, WellbeingEntry, QueuedEntry } from '@/lib/domain/types';
export function useHlyja(initial: AppData, owner: string, demo: boolean) {
  const [data, setData] = useState(initial),
    [queue, setQueue] = useState<QueuedEntry[]>([]),
    [syncing, setSyncing] = useState(false),
    [online, setOnline] = useState(true),
    [syncError, setSyncError] = useState('');
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (!demo) setData(await api<AppData>('/api/data'));
  }, [demo]);
  const sync = useCallback(async () => {
    if (demo || busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      const entries = await pending(owner);
      setQueue(entries);
      if (!navigator.onLine) return;
      for (const entry of entries) {
        const saved = await api<MoodEntry | WellbeingEntry>('/api/entries', 'POST', {
          kind: entry.kind,
          payload: entry.payload,
        });
        // Keep the acknowledged observation visible even if the following refresh fails.
        setData((previous) =>
          entry.kind === 'mood'
            ? {
                ...previous,
                moods: [
                  ...previous.moods.filter((item) => item.id !== saved.id),
                  saved as MoodEntry,
                ],
              }
            : {
                ...previous,
                wellbeing: [
                  ...previous.wellbeing.filter((item) => item.id !== saved.id),
                  saved as WellbeingEntry,
                ],
              },
        );
        await acknowledge(entry.id, owner);
        setQueue(await pending(owner));
      }
      if (entries.length) await refresh();
      setQueue(await pending(owner));
      setSyncError('');
    } catch (e) {
      setSyncError((e as Error).message);
    } finally {
      setSyncing(false);
      busy.current = false;
    }
  }, [demo, owner, refresh]);
  useEffect(() => {
    if (demo) return;
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void sync();
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const timer = window.setInterval(() => {
      if (navigator.onLine) void sync();
    }, 30000);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      clearInterval(timer);
    };
  }, [demo, sync]);
  const saveEntry = async (kind: 'mood' | 'wellbeing', payload: MoodEntry | WellbeingEntry) => {
    if (demo) {
      setData((prev) =>
        kind === 'mood'
          ? {
              ...prev,
              moods: [...prev.moods.filter((e) => e.id !== payload.id), payload as MoodEntry],
            }
          : {
              ...prev,
              wellbeing: [
                ...prev.wellbeing.filter((e) => e.id !== payload.id),
                payload as WellbeingEntry,
              ],
            },
      );
      return;
    }
    if (storageConsent(owner)) {
      const entry: QueuedEntry = {
        id: payload.id,
        owner,
        kind,
        payload,
        queuedAt: new Date().toISOString(),
      };
      await enqueue(entry);
      setQueue(await pending(owner));
      void sync();
    } else {
      const saved = await api<MoodEntry | WellbeingEntry>('/api/entries', 'POST', {
        kind,
        payload,
      });
      setData((prev) =>
        kind === 'mood'
          ? { ...prev, moods: [...prev.moods.filter((e) => e.id !== saved.id), saved as MoodEntry] }
          : {
              ...prev,
              wellbeing: [
                ...prev.wellbeing.filter((e) => e.id !== saved.id),
                saved as WellbeingEntry,
              ],
            },
      );
    }
  };
  const visible: AppData = {
    ...data,
    moods: [
      ...data.moods,
      ...queue
        .filter((e) => e.kind === 'mood' && !data.moods.some((m) => m.id === e.id))
        .map((e) => e.payload as MoodEntry),
    ],
    wellbeing: [
      ...data.wellbeing,
      ...queue
        .filter((e) => e.kind === 'wellbeing' && !data.wellbeing.some((w) => w.id === e.id))
        .map((e) => e.payload as WellbeingEntry),
    ],
  };
  return { data: visible, setData, queue, syncing, syncError, online, saveEntry, refresh, sync };
}
