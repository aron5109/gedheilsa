import { guard, json, failure, check } from '@/lib/server/http';
import { authServer } from '@/lib/neon/auth';
export async function POST(request: Request) {
  try {
    await guard(request, true);
    const { error } = await authServer().signOut();
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
