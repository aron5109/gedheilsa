import { z } from 'zod';
const id = z.uuid();
const stamp = z.iso.datetime({ offset: true });
export const moodSchema = z.object({
  id,
  score: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  emotions: z.array(z.string().max(40)).max(12),
  note: z.string().max(4000),
  occurred_at: stamp.refine(
    (v) => new Date(v).getTime() <= Date.now() + 60000,
    'Tíminn má ekki vera í framtíðinni.',
  ),
});
export const wellbeingSchema = z
  .object({
    id,
    kind: z.enum(['water', 'sleep', 'movement', 'steps']),
    value: z.number().finite().min(0).max(100000),
    occurred_at: stamp.refine((v) => new Date(v).getTime() <= Date.now() + 60000),
    source: z.literal('manual'),
  })
  .superRefine((v, c) => {
    const max = { water: 5000, sleep: 24, movement: 1440, steps: 100000 }[v.kind];
    if (v.value > max)
      c.addIssue({ code: 'custom', message: 'Gildið er of hátt.', path: ['value'] });
  });
export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    birth_year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getUTCFullYear() - 18)
      .nullable(),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat('is', { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    interests: z.array(z.string().trim().min(1).max(80)).max(20),
    comfort_activities: z.array(z.string().trim().min(1).max(160)).max(20),
    water_goal_ml: z.number().int().min(250).max(6000),
    support_enabled: z.boolean(),
    support_days: z.number().int().min(3).max(14),
    health_consent: z.literal(true),
    adult_confirmed: z.literal(true),
    support_consent: z.boolean(),
    onboarding_completed: z.literal(true),
  })
  .refine((v) => !v.support_enabled || v.support_consent, 'Samþykki þarf fyrir tilkynningum.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const routineSchema = z.object({
  id,
  title: z.string().trim().min(1).max(120),
  kind: z.enum(['medication', 'mood', 'water', 'sleep']),
  times: z
    .array(time)
    .min(1)
    .max(8)
    .transform((v) => [...new Set(v)].sort()),
  enabled: z.boolean(),
});
export const routineLogSchema = z.object({
  id,
  routine_id: id,
  scheduled_date: z.iso.date(),
  scheduled_time: time,
  status: z.enum(['taken', 'skipped']),
});
export const appointmentSchema = z.object({
  id,
  title: z.string().trim().min(1).max(160),
  starts_at: stamp,
  duration_minutes: z.number().int().min(5).max(480),
  location: z.string().max(200),
  reminder_minutes: z.number().int().min(5).max(10080),
});
export const contactSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  consent: z.literal(true),
});
export const exportSchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    email: z.email().max(254).optional(),
    include_notes: z.boolean(),
    consent: z.boolean().optional(),
    request_id: id.optional(),
  })
  .refine((v) => v.from <= v.to, 'Dagsetningar eru ekki í réttri röð.');
export const pushSchema = z.object({
  endpoint: z
    .url()
    .max(2000)
    .refine((v) => {
      const u = new URL(v);
      return (
        u.protocol === 'https:' &&
        ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].some(
          (h) => u.hostname === h || u.hostname.endsWith('.' + h),
        )
      );
    }),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .max(200),
    auth: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .max(100),
  }),
});
