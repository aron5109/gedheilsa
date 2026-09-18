import { z } from 'zod';
import { guard, json, failure, body, check, HttpError } from '@/lib/server/http';
import { authServer } from '@/lib/neon/auth';
export async function DELETE(request: Request) {
  try {
    await guard(request, true);
    await body(request, z.object({ confirmation: z.literal('EYÐA ÖLLU') }));
    const { data, error } = await authServer().deleteUser({});
    check(error);
    if (!data?.success || data.message !== 'User deleted')
      throw new HttpError(409, 'Ekki tókst að ljúka eyðingu. Skráðu þig inn aftur og reyndu á ný.');
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
