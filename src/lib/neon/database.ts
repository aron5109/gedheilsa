import 'server-only';
import { neon, types } from '@neondatabase/serverless';

// Keep the existing JSON contract: ISO instants, YYYY-MM-DD dates and numeric measurements.
types.setTypeParser(1184, (value: string) => new Date(value).toISOString());
types.setTypeParser(1082, (value: string) => value);
types.setTypeParser(1700, (value: string) => Number(value));

export interface Database {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<T[]>;
}
export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function scopedDatabase(role: 'hlyja_user' | 'hlyja_worker', userId = ''): Database {
  const url = databaseUrl();
  if (!url) throw new Error('Gagnageymsla bíður uppsetningar.');
  const sql = neon(url);
  return {
    async query<T>(text: string, values: unknown[] = []) {
      // SET LOCAL and identity must share the query's transaction. They cannot leak
      // between users when Neon's pooled connection is reused.
      const result = await sql.transaction([
        sql.query(`SET LOCAL ROLE ${role}`),
        sql.query("select set_config('app.user_id', $1, true)", [userId]),
        sql.query(text, values),
      ]);
      return result[2] as T[];
    },
  };
}

/** Only pass the user ID returned by the verified server session. */
export function userDatabase(userId: string): Database {
  if (!userId) throw new Error('Innskráning er nauðsynleg.');
  return scopedDatabase('hlyja_user', userId);
}

/** For cron, verified contact tokens and narrowly scoped privileged operations. */
export function workerDatabase(): Database {
  return scopedDatabase('hlyja_worker');
}

export function isConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
