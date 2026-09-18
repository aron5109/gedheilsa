import { insert } from '@/lib/neon/repository';
import { guard, json, failure, body } from '@/lib/server/http';
import { routineSchema } from '@/lib/domain/validation';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, routineSchema);
    const data = await insert(db, 'routines', { ...value, user_id: user.id }, { columns: ['id'] });
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
