import { guard, json, failure, body, check, HttpError } from '@/lib/server/http';
import { routineLogSchema } from '@/lib/domain/validation';
import { dayKey, localTime } from '@/lib/domain/mood';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, routineLogSchema);
    const { data: p, error: pe } = await db
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();
    check(pe);
    if (!p) throw new HttpError(404, 'Færsla fannst ekki.');
    const now = new Date();
    if (
      value.scheduled_date > dayKey(now, p.timezone) ||
      (value.scheduled_date === dayKey(now, p.timezone) &&
        value.scheduled_time > localTime(now, p.timezone))
    )
      throw new HttpError(400, 'Ekki er hægt að staðfesta framtíðarskammt.');
    const { data: r, error: re } = await db
      .from('routines')
      .select('times,enabled')
      .eq('id', value.routine_id)
      .eq('user_id', user.id)
      .single();
    check(re);
    if (!r) throw new HttpError(404, 'Færsla fannst ekki.');
    if (!r.enabled || !r.times.includes(value.scheduled_time))
      throw new HttpError(400, 'Áminningin er ekki virk á þessum tíma.');
    const { data, error } = await db
      .from('routine_logs')
      .insert({ ...value, user_id: user.id })
      .select()
      .single();
    if (error?.code === '23505') throw new HttpError(409, 'Þessi tími hefur þegar verið skráður.');
    check(error);
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
