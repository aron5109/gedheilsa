import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function worker() {
  type Event = {
    data?: { json: () => unknown };
    notification?: { close: () => void; data: { url: string } };
    waitUntil: (p: Promise<unknown>) => void;
  };
  const listeners: Record<string, (e: Event) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const focus = vi.fn().mockResolvedValue(undefined);
  const clients = { claim: vi.fn(), matchAll: vi.fn().mockResolvedValue([]), openWindow };
  const self = {
    addEventListener: (name: string, fn: (e: Event) => void) => {
      listeners[name] = fn;
    },
    registration: { showNotification },
    skipWaiting: vi.fn(),
    location: { origin: 'https://hlyja.example' },
  };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, clients, URL });
  return { listeners, showNotification, openWindow, focus, clients };
}
describe('real notification worker', () => {
  it('displays the server greeting rather than silently replacing it', async () => {
    const w = worker();
    await new Promise((resolve) =>
      w.listeners.push({
        data: { json: () => ({ body: 'Hæ, Aron. Hvernig hefurðu það?', url: '/app?skra=lidan' }) },
        waitUntil: resolve,
      }),
    );
    expect(w.showNotification).toHaveBeenCalledWith(
      'Hlýja',
      expect.objectContaining({
        body: 'Hæ, Aron. Hvernig hefurðu það?',
        data: { url: '/app?skra=lidan' },
      }),
    );
  });
  it('handles null or malformed payloads and rejects external navigation', async () => {
    const w = worker();
    for (const value of [null, {}, { body: 'Hæ.', url: 'https://other.invalid' }]) {
      await new Promise((resolve) =>
        w.listeners.push({ data: { json: () => value }, waitUntil: resolve }),
      );
      expect(w.showNotification).toHaveBeenLastCalledWith(
        'Hlýja',
        expect.objectContaining({ data: { url: '/app' } }),
      );
    }
  });
  it('opens a known destination without reloading a different unfinished form', async () => {
    const w = worker();
    w.clients.matchAll.mockResolvedValue([{ url: 'https://hlyja.example/app', focus: w.focus }]);
    await new Promise((resolve) =>
      w.listeners.notificationclick({
        notification: { close: vi.fn(), data: { url: '/app?skra=vatn' } },
        waitUntil: resolve,
      }),
    );
    expect(w.openWindow).toHaveBeenCalledWith('https://hlyja.example/app?skra=vatn');
    expect(w.focus).not.toHaveBeenCalled();
  });
});
