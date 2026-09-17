import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { guard, json, failure, body, check, rateLimit, HttpError } from '@/lib/server/http';
import { adminClient } from '@/lib/supabase/server';
import { contactSchema } from '@/lib/domain/validation';
import { sendEmail, emailReady } from '@/lib/server/mail';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, contactSchema);
    if (!emailReady()) throw new HttpError(503, 'Tölvupóstsendingar bíða uppsetningar.');
    await rateLimit(user.id, 'contact-invite', 5);
    const { data: profile, error: pError } = await db
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    check(pError);
    if (!profile) throw new HttpError(404, 'Færsla fannst ekki.');
    const admin = adminClient();
    const { data: existing, error: readError } = await admin
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', value.id)
      .maybeSingle();
    check(readError);
    if (
      existing &&
      (existing.email !== value.email || existing.name !== value.name || !existing.enabled)
    )
      throw new HttpError(409, 'Skráðu aðstandandann aftur með nýrri færslu.');
    if (existing?.verified_at) return json(existing);
    if (!existing) {
      const { count, error: countError } = await db
        .from('trusted_contacts')
        .select('id', { head: true, count: 'exact' })
        .eq('enabled', true);
      check(countError);
      if ((count ?? 0) >= 5) throw new HttpError(400, 'Hægt er að skrá allt að fimm aðstandendur.');
      const { error } = await admin.from('trusted_contacts').insert({
        id: value.id,
        user_id: user.id,
        name: value.name,
        email: value.email.toLowerCase(),
      });
      check(error);
    }
    const token = randomBytes(32).toString('hex');
    const { error: tokenError } = await admin.from('contact_tokens').insert({
      contact_id: value.id,
      token_hash: createHash('sha256').update(token).digest('hex'),
      purpose: 'verify',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    check(tokenError);
    const url = new URL('/stadfesta', process.env.NEXT_PUBLIC_APP_URL);
    url.searchParams.set('token', token);
    await sendEmail(
      value.email,
      'Boð um að vera stuðningsaðili í Hlýju',
      `${profile.name} vill skrá þig sem stuðningsaðila í Hlýju. Ef þú samþykkir gætir þú fengið stutta beiðni um að hafa samband þegar viðkomandi hefur sérstaklega heimilað það. Þú færð hvorki skapskráningar, lyfjaupplýsingar né dagbókartexta.\n\nHlýja er ekki neyðarþjónusta og þetta felur ekki í sér ábyrgð á öryggi viðkomandi.\n\nSkoða og samþykkja boð (gildir í 7 daga):\n${url}\n\nEf þú kannast ekki við boðið máttu hunsa það. Engar tilkynningar verða sendar án staðfestingar.`,
      `contact-${value.id}-${token.slice(0, 12)}`,
    );
    const { data, error } = await db
      .from('trusted_contacts')
      .select('*')
      .eq('id', value.id)
      .single();
    check(error);
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { user } = await guard(request, true);
    const { id } = await body(request, z.object({ id: z.uuid() }));
    const admin = adminClient();
    const { error } = await admin
      .from('trusted_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    check(error);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
