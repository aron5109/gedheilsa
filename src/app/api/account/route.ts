import { z } from 'zod';
import { guard, json, failure, body, check } from '@/lib/server/http';
import { adminClient } from '@/lib/supabase/server';
export async function DELETE(request: Request) {
  try {
    const { user } = await guard(request, true);
    await body(request, z.object({ confirmation: z.literal('EYÐA ÖLLU') }));
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
