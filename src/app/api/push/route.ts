import { guard, json, failure, body, check, HttpError } from '@/lib/server/http';
import { pushSchema } from '@/lib/domain/validation';
import { z } from 'zod';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      throw new HttpError(503, 'Tilkynningar bíða uppsetningar.');
    const value = await body(request, pushSchema);
    const { error } = await db
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint: value.endpoint, subscription: value },
        { onConflict: 'user_id,endpoint' },
      );
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const { endpoint } = await body(request, z.object({ endpoint: z.string() }));
    const { error } = await db
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
