import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, it, expect, vi } from 'vitest';
import { userDatabase } from '@/lib/neon/database';
import { POST as entry } from '@/app/api/entries/route';
import { POST as profile } from '@/app/api/profile/route';
import { POST as routine } from '@/app/api/routines/route';
import { POST as log } from '@/app/api/routine-logs/route';
import { POST as appointment } from '@/app/api/appointments/route';
import { GET as exportData } from '@/app/api/export/route';
import { runScheduler } from '@/lib/server/scheduler';
const state = vi.hoisted(() => ({
  owner: '00000000-0000-4000-8000-000000000011',
  configured: true,
}));
const alice = state.owner,
  bob = '00000000-0000-4000-8000-000000000012';
const pg = new PGlite({ parsers: { 1700: Number } });
vi.mock('server-only', () => ({}));
vi.mock('@/lib/neon/auth', () => ({
  configured: () => state.configured,
  currentUser: async () => (state.owner ? { id: state.owner } : null),
}));
// Exercise the production transaction wrapper against PostgreSQL, replacing only HTTP transport.
vi.mock('@neondatabase/serverless', () => ({
  types: { setTypeParser: () => {} },
  neon: () => ({
    query: (sql: string, values: unknown[] = []) => ({ sql, values }),
    transaction: async (queries: { sql: string; values: unknown[] }[]) =>
      pg.transaction(async (tx) => {
        const results = [];
        for (const q of queries) results.push((await tx.query(q.sql, q.values)).rows);
        return JSON.parse(JSON.stringify(results));
      }),
  }),
}));
const request = (data: unknown, origin = 'https://hlyja.example') =>
  new Request('https://hlyja.example/api/test', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
const profileInput = {
  name: 'Prófun',
  birth_year: null,
  timezone: 'Atlantic/Reykjavik',
  interests: ['Tónlist'],
  comfort_activities: [],
  water_goal_ml: 1500,
  personal_notifications: false,
  support_enabled: false,
  support_days: 3,
  health_consent: true,
  adult_confirmed: true,
  support_consent: false,
  onboarding_completed: true,
};
const mood = {
  id: randomUUID(),
  score: 2,
  energy: 3,
  emotions: ['Þreyta'],
  note: "Texti '; DROP TABLE profiles; --",
  occurred_at: new Date().toISOString(),
};
beforeAll(async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost/test');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://hlyja.example');
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubEnv('VAPID_PRIVATE_KEY', '');
  await pg.exec('create schema neon_auth; create table neon_auth."user"(id uuid primary key);');
  await pg.exec(readFileSync('db/migrations/202609180001_neon.sql', 'utf8'));
  await pg.query('insert into neon_auth."user" values($1),($2)', [alice, bob]);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
it('rejects unconfigured, anonymous and cross-origin mutations', async () => {
  state.configured = false;
  expect((await entry(request({}))).status).toBe(503);
  state.configured = true;
  state.owner = '';
  expect((await entry(request({}))).status).toBe(401);
  state.owner = alice;
  expect((await entry(request({}, 'https://other.example'))).status).toBe(403);
});
it('creates a profile and preserves first health consent on atomic updates', async () => {
  const first = await profile(request(profileInput));
  expect(first.status).toBe(200);
  const p = await first.json();
  const update = await profile(request({ ...profileInput, name: 'Annað nafn' }));
  expect(update.status).toBe(200);
  expect((await update.json()).health_consent_at).toBe(p.health_consent_at);
  state.owner = bob;
  expect((await profile(request(profileInput))).status).toBe(200);
  state.owner = alice;
});
it('acknowledges identical retries but rejects changed content without overwriting', async () => {
  const first = await entry(request({ kind: 'mood', payload: mood }));
  expect(first.status).toBe(201);
  expect((await first.json()).note).toBe(mood.note);
  expect((await entry(request({ kind: 'mood', payload: mood }))).status).toBe(200);
  expect((await entry(request({ kind: 'mood', payload: { ...mood, score: 5 } }))).status).toBe(409);
  const rows = await userDatabase(alice).query<{ score: number }>(
    'select score from hlyja.mood_entries',
  );
  expect(rows).toEqual([{ score: 2 }]);
});
it('does not acknowledge another owner’s UUID and isolates consecutive pooled queries', async () => {
  state.owner = bob;
  expect((await entry(request({ kind: 'mood', payload: mood }))).status).toBe(409);
  expect(await userDatabase(bob).query('select * from hlyja.mood_entries')).toEqual([]);
  expect((await userDatabase(alice).query('select * from hlyja.mood_entries')).length).toBe(1);
  expect(await userDatabase(bob).query('select * from hlyja.mood_entries')).toEqual([]);
  state.owner = alice;
});
it('stores fractional sleep values and acknowledges equivalent timestamps', async () => {
  const payload = {
    id: randomUUID(),
    kind: 'sleep',
    value: 7.5,
    source: 'manual',
    occurred_at: new Date().toISOString(),
  };
  expect((await entry(request({ kind: 'wellbeing', payload }))).status).toBe(201);
  expect(
    (
      await entry(
        request({
          kind: 'wellbeing',
          payload: { ...payload, occurred_at: payload.occurred_at.replace('Z', '+00:00') },
        }),
      )
    ).status,
  ).toBe(200);
});
it('prevents cross-owner routine upserts and duplicate medication logs', async () => {
  const r = {
    id: randomUUID(),
    kind: 'medication',
    title: 'Prófun',
    times: ['00:00'],
    enabled: true,
  };
  expect((await routine(request(r))).status).toBe(200);
  state.owner = bob;
  expect((await routine(request({ ...r, title: 'Yfirskrifað' }))).status).toBe(500);
  state.owner = alice;
  const data = {
    id: randomUUID(),
    routine_id: r.id,
    scheduled_date: '2026-01-01',
    scheduled_time: '00:00',
    status: 'taken',
  };
  expect((await log(request(data))).status).toBe(200);
  expect((await log(request({ ...data, id: randomUUID() }))).status).toBe(409);
});
it('exports more than 1000 records without leaking another owner’s records', async () => {
  await pg.query(
    'insert into hlyja.mood_entries(id,user_id,score,energy,occurred_at) select gen_random_uuid(),$1,3,3,now() from generate_series(1,1005)',
    [alice],
  );
  const result = await exportData(new Request('https://hlyja.example/api/export'));
  expect(result.status).toBe(200);
  expect((await result.json()).moods).toHaveLength(1006);
  state.owner = bob;
  expect(
    (await (await exportData(new Request('https://hlyja.example/api/export'))).json()).moods,
  ).toHaveLength(0);
  state.owner = alice;
});
it('queues due appointments only once when delivery is unavailable', async () => {
  const now = new Date();
  expect(
    (
      await appointment(
        request({
          id: randomUUID(),
          title: 'Prófun',
          starts_at: new Date(+now + 30 * 60000).toISOString(),
          duration_minutes: 30,
          location: '',
          reminder_minutes: 30,
        }),
      )
    ).status,
  ).toBe(200);
  await runScheduler(now);
  await runScheduler(now);
  const jobs = await pg.query<{ n: number }>('select count(*)::int n from hlyja.notification_jobs');
  expect(jobs.rows[0].n).toBe(1);
});
it('deleting the managed auth user cascades only their health data', async () => {
  await pg.query('delete from neon_auth."user" where id=$1', [alice]);
  expect(await userDatabase(alice).query('select * from hlyja.mood_entries')).toEqual([]);
  expect((await userDatabase(bob).query('select * from hlyja.profiles')).length).toBe(1);
});
