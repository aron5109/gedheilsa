import 'server-only';
import { NextResponse } from 'next/server';
import { currentUser, configured } from '@/lib/neon/auth';
import { userDatabase, workerDatabase } from '@/lib/neon/database';
import type { ZodType } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Pragma: 'no-cache' },
  });
}
export async function guard(request: Request, mutation = false) {
  if (mutation) {
    const origin = request.headers.get('origin');
    const expected = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin;
    if (origin !== expected) throw new HttpError(403, 'Beiðnin var ekki samþykkt.');
  }
  if (!configured()) throw new HttpError(503, 'Innskráning og gagnageymsla bíða uppsetningar.');
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Skráðu þig inn til að halda áfram.');
  return { db: userDatabase(user.id), user };
}
export async function body<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Ógild beiðni.');
  const decoder = new TextDecoder();
  let raw = '';
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 32000) {
      await reader.cancel();
      throw new HttpError(413, 'Beiðnin er of stór.');
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Ógild beiðni.');
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new HttpError(400, 'Yfirfarðu upplýsingarnar og reyndu aftur.');
  return result.data;
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  return json({ error: 'Ekki tókst að ljúka aðgerðinni. Reyndu aftur.' }, 500);
}
export function check(error: { message?: string } | null) {
  if (error) throw new HttpError(500, 'Ekki tókst að vista eða sækja gögn. Reyndu aftur.');
}
export async function rateLimit(userId: string, action: string, max = 10) {
  const [result] = await workerDatabase().query<{ allowed: boolean }>(
    'select hlyja.consume_rate_limit($1,$2,$3) as allowed',
    [`${userId}:${action}`, max, 3600],
  );
  if (!result.allowed) throw new HttpError(429, 'Of margar beiðnir. Reyndu aftur síðar.');
}
