// Read-only deployment smoke check. Never prints URLs, credentials or user rows.
import { neon } from '@neondatabase/serverless';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
try {
  const sql = neon(url);
  const results = await sql.transaction([
    sql.query('set local role hlyja_user'),
    sql.query("select set_config('app.user_id',$1,true)", ['00000000-0000-4000-8000-000000000000']),
    sql.query('select count(*)::int as n from hlyja.profiles'),
    sql.query('select 7.5::numeric as value, now() as instant'),
  ]);
  if (results[2][0].n !== 0) throw new Error('Isolation failed');
  console.log('Neon HTTP connection, transaction-local role and empty-owner isolation: passed.');
} catch {
  console.error('Neon verification failed. Check configuration and migrations.');
  process.exitCode = 1;
}
