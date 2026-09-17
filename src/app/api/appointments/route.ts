import { guard, json, failure, body, check } from '@/lib/server/http';
import { appointmentSchema } from '@/lib/domain/validation';
import { z } from 'zod';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, appointmentSchema);
    const { data, error } = await db
      .from('appointments')
      .insert({ ...value, user_id: user.id })
      .select()
      .single();
    check(error);
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const { id } = await body(request, z.object({ id: z.uuid() }));
    const { error } = await db.from('appointments').delete().eq('id', id).eq('user_id', user.id);
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
