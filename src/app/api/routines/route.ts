import { guard, json, failure, body, check } from '@/lib/server/http';
import { routineSchema } from '@/lib/domain/validation';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, routineSchema);
    const { data, error } = await db
      .from('routines')
      .upsert({ ...value, user_id: user.id })
      .select()
      .single();
    check(error);
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
