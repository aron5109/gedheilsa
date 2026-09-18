import { guard, json, failure, body, HttpError } from '@/lib/server/http';
import { moodSchema, wellbeingSchema } from '@/lib/domain/validation';
import { insert } from '@/lib/neon/repository';
import { isConflict } from '@/lib/neon/database';
import { z } from 'zod';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const input = await body(
      request,
      z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('mood'), payload: moodSchema }),
        z.object({ kind: z.literal('wellbeing'), payload: wellbeingSchema }),
      ]),
    );
    const table = input.kind === 'mood' ? 'mood_entries' : 'wellbeing_entries';
    let replay = false;
    try {
      await insert(db, table, { ...input.payload, user_id: user.id });
    } catch (error) {
      if (!isConflict(error)) throw error;
      replay = true;
    }
    const [data] = await db.query<Record<string, unknown> & { occurred_at: string }>(
      `select * from hlyja.${table} where id=$1 and user_id=$2`,
      [input.payload.id, user.id],
    );
    if (!data)
      throw new HttpError(409, 'Auðkenni færslunnar rekst á aðra færslu. Færslan er enn í bið.');
    const { occurred_at, ...rest } = input.payload;
    const sameTime = new Date(data.occurred_at).getTime() === new Date(occurred_at).getTime();
    const same = Object.entries(rest).every(
      ([k, v]) => JSON.stringify(data[k]) === JSON.stringify(v),
    );
    if (!sameTime || !same)
      throw new HttpError(409, 'Færslan hefur annað innihald. Færslan er enn í bið.');
    return json(data, replay ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
