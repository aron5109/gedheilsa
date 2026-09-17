import { createHash } from 'node:crypto';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/server';
import { json, failure, body, check, HttpError } from '@/lib/server/http';
export async function POST(request: Request) {
  try {
    const expected = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin;
    if (request.headers.get('origin') !== expected) throw new HttpError(403, 'Ógild beiðni.');
    const value = await body(
      request,
      z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), action: z.enum(['verify', 'revoke']) }),
    );
    const { data, error } = await adminClient().rpc('consume_contact_token', {
      hash: createHash('sha256').update(value.token).digest('hex'),
      action: value.action,
    });
    check(error);
    if (!data) throw new HttpError(400, 'Hlekkurinn er útrunninn eða hefur þegar verið notaður.');
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
