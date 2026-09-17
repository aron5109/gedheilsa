import { guard, json, failure } from '@/lib/server/http';
import { loadData } from '@/lib/server/data';
export async function GET(request: Request) {
  try {
    const { db, user } = await guard(request);
    return json(await loadData(db, user.id));
  } catch (e) {
    return failure(e);
  }
}
