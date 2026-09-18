import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
const db = new PGlite();
const alice = '00000000-0000-4000-8000-000000000001',
  bob = '00000000-0000-4000-8000-000000000002';
async function asUser(id: string) {
  await db.exec(`reset role; select set_config('app.user_id','${id}',false); set role hlyja_user;`);
}
beforeAll(async () => {
  await db.exec(
    'create schema neon_auth; create table neon_auth."user"(id uuid primary key); create role anon;',
  );
  for (const file of readdirSync('db/migrations')
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
  }
  await db.exec(
    `insert into neon_auth."user"(id) values('${alice}'),('${bob}');insert into hlyja.profiles(id,name,health_consent_at) values('${alice}','A',now()),('${bob}','B',now());insert into hlyja.mood_entries(id,user_id,score,energy,occurred_at) values('10000000-0000-4000-8000-000000000001','${alice}',2,2,now()),('10000000-0000-4000-8000-000000000002','${bob}',4,4,now());insert into hlyja.routines(id,user_id,title,kind,times) values('30000000-0000-4000-8000-000000000002','${bob}','B lyf','medication',array['08:00']);insert into hlyja.trusted_contacts(id,user_id,name,email) values('40000000-0000-4000-8000-000000000001','${alice}','Vinur','test@example.invalid');`,
  );
});
afterAll(async () => {
  await db.close();
});
describe('Neon database access boundaries (real PostgreSQL engine)', () => {
  it('keeps personal lock-screen messages off until the owner opts in', async () => {
    await asUser(alice);
    const before = await db.query<{ personal_notifications: boolean }>(
      'select personal_notifications from hlyja.profiles',
    );
    expect(before.rows).toEqual([{ personal_notifications: false }]);
    await db.exec(`update hlyja.profiles set personal_notifications=true where id='${bob}'`);
    await asUser(bob);
    const other = await db.query<{ personal_notifications: boolean }>(
      'select personal_notifications from hlyja.profiles',
    );
    expect(other.rows).toEqual([{ personal_notifications: false }]);
    await asUser(alice);
    await db.exec('update hlyja.profiles set personal_notifications=true');
    const after = await db.query<{ personal_notifications: boolean }>(
      'select personal_notifications from hlyja.profiles',
    );
    expect(after.rows).toEqual([{ personal_notifications: true }]);
  });
  it('enables RLS on every application table', async () => {
    await db.exec('reset role');
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='hlyja' and relkind='r'",
    );
    expect(result.rows).toHaveLength(11);
    expect(result.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it('returns only the current user’s data', async () => {
    await asUser(alice);
    const result = await db.query<{ user_id: string }>('select user_id from hlyja.mood_entries');
    expect(result.rows).toEqual([{ user_id: alice }]);
  });
  it('blocks writing to another owner and mutating mood history', async () => {
    await asUser(alice);
    await expect(
      db.exec(
        `insert into hlyja.mood_entries(id,user_id,score,energy,occurred_at) values(gen_random_uuid(),'${bob}',1,1,now())`,
      ),
    ).rejects.toThrow();
    await expect(db.exec('update hlyja.mood_entries set score=5')).rejects.toThrow();
    await expect(db.exec('delete from hlyja.mood_entries')).rejects.toThrow();
  });
  it('does not expose any health data anonymously', async () => {
    await db.exec('reset role;set role anon');
    await expect(db.query('select * from hlyja.mood_entries')).rejects.toThrow();
  });
  it('prevents self-verification of a trusted contact', async () => {
    await asUser(alice);
    await expect(db.exec('update hlyja.trusted_contacts set verified_at=now()')).rejects.toThrow();
    await expect(db.query('select * from hlyja.contact_tokens')).rejects.toThrow();
    await expect(
      db.query("select hlyja.consume_contact_token('secret','verify')"),
    ).rejects.toThrow();
  });
  it('prevents queueing notifications and reading rate limit internals', async () => {
    await asUser(alice);
    await expect(db.query('select * from hlyja.notification_jobs')).rejects.toThrow();
    await expect(db.query('select * from hlyja.rate_limits')).rejects.toThrow();
    await expect(db.query('select hlyja.claim_notification_jobs(50)')).rejects.toThrow();
  });
  it('prevents cross-owner medication logs even with a valid foreign id', async () => {
    await asUser(alice);
    await expect(
      db.exec(
        `insert into hlyja.routine_logs(id,user_id,routine_id,scheduled_date,scheduled_time,status) values(gen_random_uuid(),'${alice}','30000000-0000-4000-8000-000000000002',current_date,'08:00','taken')`,
      ),
    ).rejects.toThrow();
  });
  it('does not merge two distinct mood observations in one day', async () => {
    await asUser(alice);
    await db.exec(
      `insert into hlyja.mood_entries(id,user_id,score,energy,occurred_at) values(gen_random_uuid(),'${alice}',3,3,now());`,
    );
    const result = await db.query<{ count: number }>(
      'select count(*)::int as count from hlyja.mood_entries',
    );
    expect(result.rows[0].count).toBe(2);
  });
  it('rejects invalid time zones even through the direct database API', async () => {
    await asUser(alice);
    await expect(db.exec("update hlyja.profiles set timezone='Not/AZone'")).rejects.toThrow();
  });
  it('atomically enforces support consent, verified recipient and seven-day cooldown', async () => {
    await db.exec('reset role');
    const recipient = '40000000-0000-4000-8000-000000000001';
    const enqueue = async (key: string) => {
      const result = await db.query<{ allowed: boolean }>(
        `select hlyja.enqueue_support_job('${alice}','${recipient}','${key}') as allowed`,
      );
      return result.rows[0].allowed;
    };
    expect(await enqueue('not-consented')).toBe(false);
    await db.exec(
      `update hlyja.profiles set support_enabled=true,consent_at=now() where id='${alice}'`,
    );
    expect(await enqueue('not-verified')).toBe(false);
    await db.exec(`update hlyja.trusted_contacts set verified_at=now() where id='${recipient}'`);
    expect(await enqueue('first')).toBe(true);
    expect(await enqueue('another-scheduler')).toBe(false);
    await db.exec(
      `update hlyja.notification_jobs set status='cancelled';update hlyja.trusted_contacts set enabled=false where id='${recipient}'`,
    );
    expect(await enqueue('revoked')).toBe(false);
    await asUser(alice);
    await expect(
      db.query(`select hlyja.enqueue_support_job('${alice}','${recipient}','unauthorized')`),
    ).rejects.toThrow();
  });
  it('allows explicit owner data deletion without affecting another user', async () => {
    await asUser(alice);
    await db.exec('select hlyja.delete_own_data()');
    const own = await db.query('select * from hlyja.mood_entries');
    expect(own.rows).toHaveLength(0);
    await asUser(bob);
    const other = await db.query('select * from hlyja.mood_entries');
    expect(other.rows).toHaveLength(1);
  });
});
