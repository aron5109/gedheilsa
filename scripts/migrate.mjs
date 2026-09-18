import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';

// SQL files are authoritative, versioned and checksum-checked. Never run on build.
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url || new URL(url).hostname.includes('-pooler')) {
  throw new Error('Set DATABASE_URL_UNPOOLED to the direct Neon connection string.');
}
neonConfig.webSocketConstructor = WebSocket;
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("select pg_advisory_xact_lock(hashtext('hlyja-migrations'))");
  await client.query(`create table if not exists public.hlyja_migrations (
    name text primary key, sha256 text not null, applied_at timestamptz not null default now());
    revoke all on public.hlyja_migrations from public;`);
  for (const name of (await readdir(new URL('../db/migrations/', import.meta.url)))
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    const source = await readFile(new URL(`../db/migrations/${name}`, import.meta.url), 'utf8');
    const checksum = createHash('sha256').update(source).digest('hex');
    const { rows } = await client.query(
      'select sha256 from public.hlyja_migrations where name=$1',
      [name],
    );
    if (rows.length) {
      if (rows[0].sha256 !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await client.query(source);
    await client.query('insert into public.hlyja_migrations(name,sha256) values($1,$2)', [
      name,
      checksum,
    ]);
    console.log(`Applied ${name}`);
  }
  await client.query('COMMIT');
} catch {
  await client.query('ROLLBACK');
  // Database errors may contain row contents or connection credentials.
  console.error(
    'Migration failed; transaction rolled back. Check schema and configuration in Neon.',
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
