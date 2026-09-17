import { guard, json, failure, body, check, rateLimit, HttpError } from '@/lib/server/http';
import { exportSchema } from '@/lib/domain/validation';
import { allRows, loadData } from '@/lib/server/data';
import { filterMoods } from '@/lib/domain/mood';
import { moodCsv } from '@/lib/domain/export';
import { sendEmail } from '@/lib/server/mail';
import type { MoodEntry } from '@/lib/domain/types';
export async function GET(request: Request) {
  try {
    const { db, user } = await guard(request);
    const data = await loadData(db, user.id);
    return json({ schema_version: 1, exported_at: new Date().toISOString(), ...data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const value = await body(request, exportSchema);
    if (!value.email || !value.consent || !value.request_id)
      throw new HttpError(400, 'Staðfestu netfang viðtakanda og samþykktu sendingu.');
    await rateLimit(user.id, 'export-email', 5);
    const { data: p, error } = await db
      .from('profiles')
      .select('timezone,name')
      .eq('id', user.id)
      .single();
    check(error);
    if (!p) throw new HttpError(404, 'Prófíll fannst ekki.');
    const entries = (await allRows(db, 'mood_entries', user.id)) as unknown as MoodEntry[];
    const selected = filterMoods(entries, value.from, value.to, p.timezone);
    if (!selected.length) throw new HttpError(400, 'Engar skráningar eru á tímabilinu.');
    const csv = moodCsv(selected, value.include_notes);
    if (Buffer.byteLength(csv) > 5_000_000)
      throw new HttpError(400, 'Veldu styttra tímabil fyrir tölvupóstsendingu.');
    await sendEmail(
      value.email,
      'Skapskráningar úr Hlýju',
      `${p.name} hefur valið að deila skapskráningum með þér frá ${value.from} til ${value.to}.\n\nMeðfylgjandi eru sjálfskráðar upplýsingar en ekki læknisfræðilegt mat. Gögnin eru viðkvæm og ætluð viðtakandanum.`,
      `export-${user.id}-${value.request_id}`,
      {
        filename: `hlyja-${value.from}-${value.to}.csv`,
        content: Buffer.from(csv).toString('base64'),
      },
    );
    return json({ ok: true, count: selected.length });
  } catch (e) {
    return failure(e);
  }
}
