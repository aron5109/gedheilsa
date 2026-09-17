'use client';
import type { QueuedEntry } from './domain/types';
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('hlyja-outbox', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('entries', { keyPath: 'id' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(new Error('Ekki tókst að opna biðgeymslu. Færslan hefur ekki verið vistuð.'));
  });
}
export async function pending(owner: string): Promise<QueuedEntry[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readonly');
      const r = tx.objectStore('entries').getAll();
      r.onsuccess = () => resolve((r.result as QueuedEntry[]).filter((e) => e.owner === owner));
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function enqueue(entry: QueuedEntry): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      let conflict = false;
      const existing = store.get(entry.id);
      existing.onsuccess = () => {
        if (!existing.result) {
          store.add(entry);
        } else if (
          existing.result.owner !== entry.owner ||
          existing.result.kind !== entry.kind ||
          JSON.stringify(existing.result.payload) !== JSON.stringify(entry.payload)
        ) {
          conflict = true;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(new Error('Biðgeymslan er full eða óaðgengileg. Færslan hefur ekki verið vistuð.'));
      tx.onabort = () =>
        reject(
          new Error(
            conflict
              ? 'Auðkenni er þegar í notkun fyrir aðra biðfærslu. Eldri færslan er óbreytt.'
              : 'Vistun í biðgeymslu mistókst.',
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function acknowledge(id: string, owner: string): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      const r = store.get(id);
      r.onsuccess = () => {
        if (r.result?.owner === owner) store.delete(id);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
