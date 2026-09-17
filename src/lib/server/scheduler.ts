import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import webpush from 'web-push';
import { adminClient } from '@/lib/supabase/server';
import { check } from './http';
import { sendEmail, emailReady } from './mail';
import { allRows } from './data';
import { dayKey, localTime, supportSignal } from '@/lib/domain/mood';
import { pushSchema } from '@/lib/domain/validation';
import type { Profile, MoodEntry, Routine, Appointment } from '@/lib/domain/types';
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
  const db = adminClient();
  let users = 0,
    delivered = 0,
    failed = 0;
  // Bounded deployment: pagination avoids the default 1,000-user silent truncation.
  for (let offset = 0; ; offset += 200) {
    const { data: profiles, error } = await db
      .from('profiles')
      .select('*')
      .order('id')
      .range(offset, offset + 199);
    check(error);
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
        const { error } = await db.from('notification_jobs').upsert(
          {
            user_id: profile.id,
            contact_id: contactId,
            kind,
            dedupe_key: key,
            payload,
            expires_at: new Date(now.getTime() + ttl).toISOString(),
          },
          { onConflict: 'dedupe_key', ignoreDuplicates: true },
        );
        check(error);
      };
      const routines = (await allRows(db, 'routines', profile.id)) as unknown as Routine[];
      for (const routine of routines.filter((r) => r.enabled)) {
        for (const time of routine.times) {
          // Check the current and preceding nine real minutes, including local midnight/DST transitions.
          for (let minute = 0; minute < 10; minute++) {
            const due = new Date(now.getTime() - minute * 60000);
            if (localTime(due, profile.timezone) !== time) continue;
            const dueDate = dayKey(due, profile.timezone);
            const { data: done, error: logError } = await db
              .from('routine_logs')
              .select('id')
              .eq('user_id', profile.id)
              .eq('routine_id', routine.id)
              .eq('scheduled_date', dueDate)
              .eq('scheduled_time', time)
              .maybeSingle();
            check(logError);
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
        const { data: moods, error: me } = await db
          .from('mood_entries')
          .select('*')
          .eq('user_id', profile.id)
          .gte(
            'occurred_at',
            new Date(now.getTime() - (profile.support_days + 2) * 86400000).toISOString(),
          )
          .order('occurred_at');
        check(me);
        // Never evaluate an incomplete 1,000-row window: fetch all history if necessary.
        const entries = (
          moods?.length === 1000 ? await allRows(db, 'mood_entries', profile.id) : (moods ?? [])
        ) as MoodEntry[];
        if (supportSignal(entries, profile.support_days, profile.timezone, now)) {
          const { data: contacts, error: ce } = await db
            .from('trusted_contacts')
            .select('id')
            .eq('user_id', profile.id)
            .eq('enabled', true)
            .not('verified_at', 'is', null);
          check(ce);
          for (const contact of contacts ?? []) {
            const { error: enqueueError } = await db.rpc('enqueue_support_job', {
              owner_id: profile.id,
              recipient_id: contact.id,
              job_key: `support:${contact.id}:${date}`,
            });
            check(enqueueError);
          }
        }
      }
    }
    if (profiles.length < 200) break;
  }
  const { data: jobs, error: claimError } = await db.rpc('claim_notification_jobs', {
    batch_size: 50,
  });
  check(claimError);
  for (const job of (jobs ?? []) as Job[]) {
    try {
      const cancel = async () => {
        const { error } = await db
          .from('notification_jobs')
          .update({ status: 'cancelled' })
          .eq('id', job.id);
        check(error);
      };
      const { data: profile, error: pe } = await db
        .from('profiles')
        .select('*')
        .eq('id', job.user_id)
        .maybeSingle();
      check(pe);
      if (!profile) {
        await cancel();
        continue;
      }
      if (job.kind === 'support') {
        const { data: contact, error: ce } = await db
          .from('trusted_contacts')
          .select('*')
          .eq('id', job.contact_id)
          .eq('user_id', job.user_id)
          .maybeSingle();
        check(ce);
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
        const { error: te } = await db.from('contact_tokens').insert({
          contact_id: contact.id,
          token_hash: createHash('sha256').update(token).digest('hex'),
          purpose: 'revoke',
          expires_at: new Date(now.getTime() + 365 * 86400000).toISOString(),
        });
        check(te);
        // Persist exact mail text before delivery: retries must use the same provider idempotency key AND body.
        const original = job.payload.mail_text;
        const text =
          original ??
          `${profile.name} hefur heimilað Hlýju að biðja þig um að hafa samband. Gæti hentað að senda hlý skilaboð eða bjóða upp á samtal?\n\nÞetta eru sjálfvirk skilaboð samkvæmt stillingum viðkomandi, ekki greining eða neyðarmat. Engin ábyrgð á eftirliti fylgir þeim.\n\nHætta að fá slíkar tilkynningar:\n${process.env.NEXT_PUBLIC_APP_URL}/stadfesta?token=${token}&action=revoke`;
        if (!original) {
          const { error } = await db
            .from('notification_jobs')
            .update({ payload: { ...job.payload, mail_text: text } })
            .eq('id', job.id);
          check(error);
        }
        await sendEmail(
          contact.email,
          'Hlýja — beiðni um að hafa samband',
          text,
          `support-${job.id}`,
        );
      } else {
        if (job.kind === 'routine') {
          const { data: r, error: re } = await db
            .from('routines')
            .select('*')
            .eq('id', job.payload.routine_id)
            .eq('user_id', job.user_id)
            .maybeSingle();
          check(re);
          const { data: l, error: le } = await db
            .from('routine_logs')
            .select('id')
            .eq('user_id', job.user_id)
            .eq('routine_id', job.payload.routine_id)
            .eq('scheduled_date', job.payload.date)
            .eq('scheduled_time', job.payload.time)
            .maybeSingle();
          check(le);
          if (!r?.enabled || !r.times.includes(job.payload.time) || l) {
            await cancel();
            continue;
          }
        }
        if (job.kind === 'appointment') {
          const { data: a, error: ae } = await db
            .from('appointments')
            .select('starts_at')
            .eq('id', job.payload.appointment_id)
            .eq('user_id', job.user_id)
            .maybeSingle();
          check(ae);
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
        const { data: subscriptions, error: se } = await db
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', job.user_id);
        check(se);
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
                title: 'Stund fyrir þig',
                body: 'Þú átt áminningu í Hlýju.',
                tag: job.id,
                url: '/app',
              }),
              { TTL: 1800, timeout: 10000 },
            );
            sent++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              const { error } = await db.from('push_subscriptions').delete().eq('id', row.id);
              check(error);
            } else throw e;
          }
        }
        if (!sent) {
          await cancel();
          continue;
        }
      }
      const { error } = await db
        .from('notification_jobs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', job.id);
      check(error);
      delivered++;
    } catch {
      failed++;
      const { error } = await db
        .from('notification_jobs')
        .update({
          status: job.attempts >= 5 ? 'failed' : 'pending',
          due_at: new Date(now.getTime() + Math.min(60, 2 ** job.attempts) * 60000).toISOString(),
          locked_at: null,
        })
        .eq('id', job.id);
      check(error);
    }
  }
  const { error: cleanup } = await db
    .from('rate_limits')
    .delete()
    .lt('expires_at', new Date(now.getTime() - 86400000).toISOString());
  check(cleanup);
  return { users, delivered, failed };
}
