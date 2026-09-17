import { timingSafeEqual } from 'node:crypto';
import { json, failure, HttpError } from '@/lib/server/http';
import { runScheduler } from '@/lib/server/scheduler';
export const maxDuration = 300;
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const token = request.headers.get('authorization') ?? '';
    const expected = `Bearer ${secret ?? ''}`;
    if (
      !secret ||
      Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    )
      throw new HttpError(401, 'Óheimill aðgangur.');
    return json(await runScheduler());
  } catch (e) {
    return failure(e);
  }
}
