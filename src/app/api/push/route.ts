import { insert } from '@/lib/neon/repository';
import { guard, json, failure, body, HttpError } from '@/lib/server/http';
import { pushSchema } from '@/lib/domain/validation';
import { z } from 'zod';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      throw new HttpError(503, 'Tilkynningar bíða uppsetningar.');
    const value = await body(request, pushSchema);
    await insert(
      db,
      'push_subscriptions',
      { user_id: user.id, endpoint: value.endpoint, subscription: value },
      { columns: ['user_id', 'endpoint'] },
    );
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const { endpoint } = await body(request, z.object({ endpoint: z.string() }));
    await db.query('delete from hlyja.push_subscriptions where user_id=$1 and endpoint=$2', [
      user.id,
      endpoint,
    ]);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
