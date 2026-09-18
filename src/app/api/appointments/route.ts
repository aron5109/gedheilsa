import { insert } from '@/lib/neon/repository';
import { guard, json, failure, body } from '@/lib/server/http';
import { appointmentSchema } from '@/lib/domain/validation';
import { z } from 'zod';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, appointmentSchema);
    const data = await insert(db, 'appointments', { ...value, user_id: user.id });
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const { id } = await body(request, z.object({ id: z.uuid() }));
    await db.query('delete from hlyja.appointments where id=$1 and user_id=$2', [id, user.id]);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
