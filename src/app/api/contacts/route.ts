import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { guard, json, failure, body, rateLimit, HttpError } from '@/lib/server/http';
import { workerDatabase } from '@/lib/neon/database';
import { insert } from '@/lib/neon/repository';
import type { Contact, Profile } from '@/lib/domain/types';
import { contactSchema } from '@/lib/domain/validation';
import { sendEmail, emailReady } from '@/lib/server/mail';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, contactSchema);
    if (!emailReady()) throw new HttpError(503, 'Tölvupóstsendingar bíða uppsetningar.');
    await rateLimit(user.id, 'contact-invite', 5);
    const [profile] = await db.query<Profile>('select name from hlyja.profiles where id=$1', [
      user.id,
    ]);
    if (!profile) throw new HttpError(404, 'Færsla fannst ekki.');
    const admin = workerDatabase();
    const [existing] = await admin.query<Contact>(
      'select * from hlyja.trusted_contacts where user_id=$1 and id=$2',
      [user.id, value.id],
    );
    if (
      existing &&
      (existing.email !== value.email.toLowerCase() ||
        existing.name !== value.name ||
        !existing.enabled)
    )
      throw new HttpError(409, 'Skráðu aðstandandann aftur með nýrri færslu.');
    if (existing?.verified_at) return json(existing);
    if (!existing) {
      const [count] = await db.query<{ n: number }>(
        'select count(*)::int as n from hlyja.trusted_contacts where user_id=$1 and enabled',
        [user.id],
      );
      if (count.n >= 5) throw new HttpError(400, 'Hægt er að skrá allt að fimm aðstandendur.');
      await insert(admin, 'trusted_contacts', {
        id: value.id,
        user_id: user.id,
        name: value.name,
        email: value.email.toLowerCase(),
      });
    }
    const token = randomBytes(32).toString('hex');
    await insert(admin, 'contact_tokens', {
      contact_id: value.id,
      token_hash: createHash('sha256').update(token).digest('hex'),
      purpose: 'verify',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    const url = new URL('/stadfesta', process.env.NEXT_PUBLIC_APP_URL);
    url.searchParams.set('token', token);
    await sendEmail(
      value.email,
      'Boð um að vera stuðningsaðili í Hlýju',
      `${profile.name} vill skrá þig sem stuðningsaðila í Hlýju. Ef þú samþykkir gætir þú fengið stutta beiðni um að hafa samband þegar viðkomandi hefur sérstaklega heimilað það. Þú færð hvorki skapskráningar, lyfjaupplýsingar né dagbókartexta.\n\nHlýja er ekki neyðarþjónusta og þetta felur ekki í sér ábyrgð á öryggi viðkomandi.\n\nSkoða og samþykkja boð (gildir í 7 daga):\n${url}\n\nEf þú kannast ekki við boðið máttu hunsa það. Engar tilkynningar verða sendar án staðfestingar.`,
      `contact-${value.id}-${token.slice(0, 12)}`,
    );
    const [data] = await db.query<Contact>(
      'select * from hlyja.trusted_contacts where id=$1 and user_id=$2',
      [value.id, user.id],
    );
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { user } = await guard(request, true);
    const { id } = await body(request, z.object({ id: z.uuid() }));
    const admin = workerDatabase();
    await admin.query('delete from hlyja.trusted_contacts where id=$1 and user_id=$2', [
      id,
      user.id,
    ]);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
