import 'fake-indexeddb/auto';
import { it, expect, describe } from 'vitest';
import { enqueue, pending, acknowledge } from '../src/lib/outbox';
import type { QueuedEntry } from '../src/lib/domain/types';
const make = (owner: string): QueuedEntry => {
  const id = crypto.randomUUID();
  return {
    id,
    owner,
    kind: 'mood',
    queuedAt: new Date().toISOString(),
    payload: {
      id,
      score: 2,
      energy: 2,
      emotions: [],
      note: 'Prófunarfærsla',
      occurred_at: new Date().toISOString(),
    },
  };
};
describe('durable outbox ownership and acknowledgement', () => {
  it('retains entries across database reopen until acknowledged', async () => {
    const item = make('reopen');
    await enqueue(item);
    expect(await pending('reopen')).toEqual([item]);
    expect(await pending('reopen')).toEqual([item]);
    await acknowledge(item.id, item.owner);
    expect(await pending(item.owner)).toEqual([]);
  });
  it('isolates users and refuses acknowledgement by another user', async () => {
    const a = make('A'),
      b = make('B');
    await enqueue(a);
    await enqueue(b);
    expect(await pending('A')).toEqual([a]);
    await acknowledge(a.id, 'B');
    expect(await pending('A')).toEqual([a]);
    await acknowledge(a.id, 'A');
    expect(await pending('B')).toEqual([b]);
  });
  it('treats exact retries idempotently and refuses changed payloads', async () => {
    const item = make('retry');
    await enqueue(item);
    await enqueue(item);
    expect(await pending('retry')).toHaveLength(1);
    await expect(
      enqueue({ ...item, payload: { ...item.payload, note: 'Changed' } as QueuedEntry['payload'] }),
    ).rejects.toThrow('Eldri færslan er óbreytt');
    expect(await pending('retry')).toEqual([item]);
  });
  it('never overwrites another owner on identifier collision', async () => {
    const item = make('original');
    await enqueue(item);
    await expect(enqueue({ ...item, owner: 'intruder' })).rejects.toThrow();
    expect(await pending('original')).toEqual([item]);
    expect(await pending('intruder')).toEqual([]);
  });
});
