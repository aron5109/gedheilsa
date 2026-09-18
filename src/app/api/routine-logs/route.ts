import { insert } from '@/lib/neon/repository';
import { isConflict } from '@/lib/neon/database';
import type { Profile, Routine } from '@/lib/domain/types';
import { guard, json, failure, body, HttpError } from '@/lib/server/http';
import { routineLogSchema } from '@/lib/domain/validation';
import { dayKey, localTime } from '@/lib/domain/mood';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, routineLogSchema);
    const [p] = await db.query<Profile>('select timezone from hlyja.profiles where id=$1', [
      user.id,
    ]);
    if (!p) throw new HttpError(404, 'Færsla fannst ekki.');
    const now = new Date();
    if (
      value.scheduled_date > dayKey(now, p.timezone) ||
      (value.scheduled_date === dayKey(now, p.timezone) &&
        value.scheduled_time > localTime(now, p.timezone))
    )
      throw new HttpError(400, 'Ekki er hægt að staðfesta framtíðarskammt.');
    const [r] = await db.query<Routine>(
      'select times,enabled from hlyja.routines where id=$1 and user_id=$2',
      [value.routine_id, user.id],
    );
    if (!r) throw new HttpError(404, 'Færsla fannst ekki.');
    if (!r.enabled || !r.times.includes(value.scheduled_time))
      throw new HttpError(400, 'Áminningin er ekki virk á þessum tíma.');
    const data = await insert(db, 'routine_logs', { ...value, user_id: user.id });
    return json(data);
  } catch (e) {
    if (isConflict(e)) return failure(new HttpError(409, 'Þessi tími hefur þegar verið skráður.'));
    return failure(e);
  }
}
