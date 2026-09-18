import 'server-only';
import type { Database } from './database';
// Identifiers are internal; values always travel as PostgreSQL parameters.
const tables = new Set([
  'profiles',
  'mood_entries',
  'wellbeing_entries',
  'routines',
  'routine_logs',
  'appointments',
  'trusted_contacts',
  'contact_tokens',
  'push_subscriptions',
  'notification_jobs',
  'rate_limits',
]);
function identifier(value: string) {
  if (!/^[a-z_]+$/.test(value)) throw new Error('Invalid SQL identifier');
  return `"${value}"`;
}
export async function insert<T>(
  db: Database,
  table: string,
  value: Record<string, unknown>,
  conflict?: { columns: string[]; ignore?: boolean },
) {
  if (!tables.has(table)) throw new Error('Invalid table');
  const keys = Object.keys(value);
  const values = Object.values(value).map((v) =>
    v !== null && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v,
  );
  let suffix = '';
  if (conflict)
    suffix =
      ` ON CONFLICT (${conflict.columns.map(identifier).join(',')}) DO ` +
      (conflict.ignore
        ? 'NOTHING'
        : `UPDATE SET ${keys
            .filter((k) => !conflict.columns.includes(k))
            .map((k) => `${identifier(k)}=EXCLUDED.${identifier(k)}`)
            .join(',')}`);
  const rows = await db.query<T>(
    `INSERT INTO hlyja.${identifier(table)} (${keys.map(identifier).join(',')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(',')})${suffix} RETURNING *`,
    values,
  );
  return rows[0];
}
