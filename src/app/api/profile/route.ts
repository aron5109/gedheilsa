import { guard, json, failure, body, check } from '@/lib/server/http';
import { profileSchema } from '@/lib/domain/validation';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, profileSchema);
    const { data: existing, error: readError } = await db
      .from('profiles')
      .select('health_consent_at,consent_at')
      .eq('id', user.id)
      .maybeSingle();
    check(readError);
    const { health_consent, adult_confirmed, support_consent, ...fields } = value;
    void health_consent;
    void adult_confirmed;
    void support_consent;
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('profiles')
      .upsert({
        ...fields,
        id: user.id,
        health_consent_at: existing?.health_consent_at ?? now,
        consent_at: fields.support_enabled ? (existing?.consent_at ?? now) : null,
        updated_at: now,
      })
      .select()
      .single();
    check(error);
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
