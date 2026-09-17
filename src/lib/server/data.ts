import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppData } from '@/lib/domain/types';
import { check } from './http';
// Supabase defaults to 1,000 rows. Page explicitly so history and exports are complete.
export async function allRows(db: SupabaseClient, table: string, userId: string, columns = '*') {
  const rows: Record<string, unknown>[] = [];
  const asOf = new Date().toISOString();
  let cursor: string | undefined;
  for (;;) {
    let query = db
      .from(table)
      .select(columns)
      .eq('user_id', userId)
      .lte('created_at', asOf)
      .order('id')
      .limit(1000);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    check(error);
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < 1000) break;
    cursor = String(batch[batch.length - 1].id);
  }
  return rows;
}
export async function loadData(db: SupabaseClient, userId: string): Promise<AppData> {
  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  check(error);
  const tables = [
    'mood_entries',
    'wellbeing_entries',
    'routines',
    'routine_logs',
    'appointments',
    'trusted_contacts',
    'notification_jobs',
  ];
  const values = await Promise.all(
    tables.map((table) =>
      allRows(
        db,
        table,
        userId,
        table === 'notification_jobs' ? 'id,user_id,kind,status,created_at,sent_at' : '*',
      ),
    ),
  );
  return {
    profile,
    moods: values[0],
    wellbeing: values[1],
    routines: values[2],
    routineLogs: values[3],
    appointments: values[4],
    contacts: values[5],
    notifications: values[6],
  } as unknown as AppData;
}
