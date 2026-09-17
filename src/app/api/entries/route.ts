import { guard, json, failure, body, check, HttpError } from '@/lib/server/http';
import { moodSchema, wellbeingSchema } from '@/lib/domain/validation';
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
    const { error } = await db.from(table).insert({ ...input.payload, user_id: user.id });
    if (error && error.code !== '23505') check(error);
    const { data, error: readError } = await db
      .from(table)
      .select('*')
      .eq('id', input.payload.id)
      .eq('user_id', user.id)
      .maybeSingle();
    check(readError);
    if (!data)
      throw new HttpError(409, 'Auðkenni færslunnar rekst á aðra færslu. Færslan er enn í bið.');
    const { occurred_at, ...rest } = input.payload;
    const sameTime = new Date(data.occurred_at).getTime() === new Date(occurred_at).getTime();
    const same = Object.entries(rest).every(
      ([k, v]) => JSON.stringify(data[k]) === JSON.stringify(v),
    );
    if (!sameTime || !same)
      throw new HttpError(409, 'Færslan hefur annað innihald. Færslan er enn í bið.');
    return json(data, error ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
