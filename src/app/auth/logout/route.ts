import { guard, json, failure, check } from '@/lib/server/http';
export async function POST(request: Request) {
  try {
    const { db } = await guard(request, true);
    const { error } = await db.auth.signOut();
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
