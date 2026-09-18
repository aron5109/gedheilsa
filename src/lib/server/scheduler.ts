import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import webpush from 'web-push';
import { workerDatabase } from '@/lib/neon/database';
import { insert } from '@/lib/neon/repository';
import { sendEmail, emailReady } from './mail';
import { allRows } from './data';
import { dayKey, localTime, supportSignal } from '@/lib/domain/mood';
import { pushSchema } from '@/lib/domain/validation';
import { reminderMessage, type ReminderKind } from '@/lib/domain/notifications';
import type { Profile, MoodEntry, Routine, Appointment, Contact } from '@/lib/domain/types';
type Job = {
  id: string;
  user_id: string;
  contact_id: string | null;
  kind: 'support' | 'routine' | 'appointment';
  payload: Record<string, string>;
  attempts: number;
  created_at: string;
};
export async function runScheduler(now = new Date()) {
  const db = workerDatabase();
  let users = 0,
    delivered = 0,
    failed = 0;
  // Bounded deployment: pagination avoids the default 1,000-user silent truncation.
  for (let offset = 0; ; offset += 200) {
    const profiles = await db.query<Profile>(
      'select * from hlyja.profiles order by id limit 200 offset $1',
      [offset],
    );
    if (!profiles?.length) break;
    for (const profile of profiles as Profile[]) {
      users++;
      const date = dayKey(now, profile.timezone);
      const enqueue = async (
        kind: string,
        key: string,
        payload: Record<string, string>,
        contactId: string | null = null,
        ttl = 1800000,
      ) => {
        await insert(
          db,
          'notification_jobs',
          {
            user_id: profile.id,
            contact_id: contactId,
            kind,
            dedupe_key: key,
            payload,
            expires_at: new Date(now.getTime() + ttl).toISOString(),
          },
          { columns: ['dedupe_key'], ignore: true },
        );
      };
      const routines = (await allRows(db, 'routines', profile.id)) as unknown as Routine[];
      for (const routine of routines.filter((r) => r.enabled)) {
        for (const time of routine.times) {
          // Check the current and preceding nine real minutes, including local midnight/DST transitions.
          for (let minute = 0; minute < 10; minute++) {
            const due = new Date(now.getTime() - minute * 60000);
            if (localTime(due, profile.timezone) !== time) continue;
            const dueDate = dayKey(due, profile.timezone);
            const [done] = await db.query(
              'select id from hlyja.routine_logs where user_id=$1 and routine_id=$2 and scheduled_date=$3 and scheduled_time=$4',
              [profile.id, routine.id, dueDate, time],
            );
            if (!done)
              await enqueue('routine', `routine:${routine.id}:${dueDate}:${time}`, {
                routine_id: routine.id,
                date: dueDate,
                time,
              });
            break;
          }
        }
      }
      const appointments = (await allRows(
        db,
        'appointments',
        profile.id,
      )) as unknown as Appointment[];
      for (const a of appointments) {
        const due = new Date(a.starts_at).getTime() - a.reminder_minutes * 60000;
        if (due <= now.getTime() && due > now.getTime() - 10 * 60000)
          await enqueue('appointment', `appointment:${a.id}:${a.starts_at}:${a.reminder_minutes}`, {
            appointment_id: a.id,
            starts_at: a.starts_at,
          });
      }
      if (profile.support_enabled && profile.consent_at && emailReady()) {
        const entries = await db.query<MoodEntry>(
          'select * from hlyja.mood_entries where user_id=$1 and occurred_at>=$2 order by occurred_at',
          [
            profile.id,
            new Date(now.getTime() - (profile.support_days + 2) * 86400000).toISOString(),
          ],
        );
        if (supportSignal(entries, profile.support_days, profile.timezone, now)) {
          const contacts = await db.query<{ id: string }>(
            'select id from hlyja.trusted_contacts where user_id=$1 and enabled and verified_at is not null',
            [profile.id],
          );
          for (const contact of contacts ?? []) {
            await db.query('select hlyja.enqueue_support_job($1,$2,$3)', [
              profile.id,
              contact.id,
              `support:${contact.id}:${date}`,
            ]);
          }
        }
      }
    }
    if (profiles.length < 200) break;
  }
  const jobs = await db.query<Job>('select * from hlyja.claim_notification_jobs($1)', [50]);
  for (const job of (jobs ?? []) as Job[]) {
    try {
      const cancel = async () => {
        await db.query("update hlyja.notification_jobs set status='cancelled' where id=$1", [
          job.id,
        ]);
      };
      const [profile] = await db.query<Profile>('select * from hlyja.profiles where id=$1', [
        job.user_id,
      ]);
      if (!profile) {
        await cancel();
        continue;
      }
      if (job.kind === 'support') {
        const [contact] = await db.query<Contact>(
          'select * from hlyja.trusted_contacts where id=$1 and user_id=$2',
          [job.contact_id, job.user_id],
        );
        if (
          !profile.support_enabled ||
          !profile.consent_at ||
          !contact?.enabled ||
          !contact.verified_at
        ) {
          await cancel();
          continue;
        }
        const entries = (await allRows(db, 'mood_entries', job.user_id)) as unknown as MoodEntry[];
        if (!supportSignal(entries, profile.support_days, profile.timezone, now)) {
          await cancel();
          continue;
        }
        const token = randomBytes(32).toString('hex');
        await insert(db, 'contact_tokens', {
          contact_id: contact.id,
          token_hash: createHash('sha256').update(token).digest('hex'),
          purpose: 'revoke',
          expires_at: new Date(now.getTime() + 365 * 86400000).toISOString(),
        });
        // Persist exact mail text before delivery: retries must use the same provider idempotency key AND body.
        const original = job.payload.mail_text;
        const text =
          original ??
          `${profile.name} hefur heimilað Hlýju að biðja þig um að hafa samband. Gæti hentað að senda hlý skilaboð eða bjóða upp á samtal?\n\nÞetta eru sjálfvirk skilaboð samkvæmt stillingum viðkomandi, ekki greining eða neyðarmat. Engin ábyrgð á eftirliti fylgir þeim.\n\nHætta að fá slíkar tilkynningar:\n${process.env.NEXT_PUBLIC_APP_URL}/stadfesta?token=${token}&action=revoke`;
        if (!original) {
          await db.query('update hlyja.notification_jobs set payload=$1::jsonb where id=$2', [
            JSON.stringify({ ...job.payload, mail_text: text }),
            job.id,
          ]);
        }
        await sendEmail(
          contact.email,
          'Hlýja — beiðni um að hafa samband',
          text,
          `support-${job.id}`,
        );
      } else {
        let reminderKind: ReminderKind = 'appointment';
        if (job.kind === 'routine') {
          const [r] = await db.query<Routine>(
            'select * from hlyja.routines where id=$1 and user_id=$2',
            [job.payload.routine_id, job.user_id],
          );
          const [l] = await db.query(
            'select id from hlyja.routine_logs where user_id=$1 and routine_id=$2 and scheduled_date=$3 and scheduled_time=$4',
            [job.user_id, job.payload.routine_id, job.payload.date, job.payload.time],
          );
          if (!r?.enabled || !r.times.includes(job.payload.time) || l) {
            await cancel();
            continue;
          }
          reminderKind = r.kind;
        }
        if (job.kind === 'appointment') {
          const [a] = await db.query<Appointment>(
            'select starts_at from hlyja.appointments where id=$1 and user_id=$2',
            [job.payload.appointment_id, job.user_id],
          );
          if (!a || new Date(a.starts_at) <= now) {
            await cancel();
            continue;
          }
        }
        if (
          !process.env.VAPID_PRIVATE_KEY ||
          !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          !process.env.VAPID_SUBJECT
        )
          throw new Error('Push unavailable');
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT,
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
        const subscriptions = await db.query<{ id: string; subscription: unknown }>(
          'select id,subscription from hlyja.push_subscriptions where user_id=$1',
          [job.user_id],
        );
        if (!subscriptions?.length) {
          await cancel();
          continue;
        }
        let sent = 0;
        for (const row of subscriptions) {
          const parsed = pushSchema.safeParse(row.subscription);
          if (!parsed.success) continue;
          try {
            await webpush.sendNotification(
              parsed.data,
              JSON.stringify({
                ...reminderMessage(profile as Profile, reminderKind, now),
                tag: job.id,
              }),
              { TTL: 1800, timeout: 10000 },
            );
            sent++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await db.query('delete from hlyja.push_subscriptions where id=$1', [row.id]);
            } else throw e;
          }
        }
        if (!sent) {
          await cancel();
          continue;
        }
      }
      await db.query("update hlyja.notification_jobs set status='sent',sent_at=$1 where id=$2", [
        new Date().toISOString(),
        job.id,
      ]);
      delivered++;
    } catch {
      failed++;
      await db.query(
        'update hlyja.notification_jobs set status=$1,due_at=$2,locked_at=null where id=$3',
        [
          job.attempts >= 5 ? 'failed' : 'pending',
          new Date(now.getTime() + Math.min(60, 2 ** job.attempts) * 60000).toISOString(),
          job.id,
        ],
      );
    }
  }
  await db.query('delete from hlyja.rate_limits where expires_at<$1', [
    new Date(now.getTime() - 86400000).toISOString(),
  ]);
  return { users, delivered, failed };
}
