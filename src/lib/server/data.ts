import 'server-only';
import type { Database } from '@/lib/neon/database';
import type { AppData, Profile } from '@/lib/domain/types';
const tables = [
  'mood_entries',
  'wellbeing_entries',
  'routines',
  'routine_logs',
  'appointments',
  'trusted_contacts',
  'notification_jobs',
];
export async function allRows(db: Database, table: string, userId: string) {
  if (!tables.includes(table)) throw new Error('Invalid table');
  const columns = table === 'notification_jobs' ? 'id,user_id,kind,status,created_at,sent_at' : '*';
  // HTTP SQL has no PostgREST row cap: one snapshot returns complete history.
  return db.query(`select ${columns} from hlyja.${table} where user_id=$1 order by id`, [userId]);
}
export async function loadData(db: Database, userId: string): Promise<AppData> {
  const [profile] = await db.query<Profile>('select * from hlyja.profiles where id=$1', [userId]);
  const values = await Promise.all(tables.map((table) => allRows(db, table, userId)));
  return {
    profile: profile ?? null,
    moods: values[0],
    wellbeing: values[1],
    routines: values[2],
    routineLogs: values[3],
    appointments: values[4],
    contacts: values[5],
    notifications: values[6],
  } as unknown as AppData;
}
