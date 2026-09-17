import { describe, it, expect } from 'vitest';
import { supportSignal, dayKey, filterMoods, dailyMoods } from '../src/lib/domain/mood';
import { moodCsv, csvCell, appointmentIcs } from '../src/lib/domain/export';
import {
  moodSchema,
  profileSchema,
  pushSchema,
  wellbeingSchema,
} from '../src/lib/domain/validation';
import type { MoodEntry, Appointment } from '../src/lib/domain/types';
const entry = (when: string, score = 2): MoodEntry => ({
  id: crypto.randomUUID(),
  score: score as MoodEntry['score'],
  energy: 3,
  emotions: ['Sorg'],
  note: 'Persónulegur texti',
  occurred_at: when,
});
const now = new Date('2026-09-17T21:00:00Z');
const low = [
  entry('2026-09-15T18:00:00Z'),
  entry('2026-09-16T18:00:00Z'),
  entry('2026-09-17T18:00:00Z'),
];
describe('opt-in support rule inputs', () => {
  it('detects only actual consecutive low days', () =>
    expect(supportSignal(low, 3, 'Atlantic/Reykjavik', now)).toBe(true));
  it('never treats absence as distress', () =>
    expect(supportSignal([low[0], low[2]], 3, 'Atlantic/Reykjavik', now)).toBe(false));
  it('requires a recent low latest entry', () => {
    expect(
      supportSignal([...low, entry('2026-09-17T20:00:00Z', 4)], 3, 'Atlantic/Reykjavik', now),
    ).toBe(false);
    expect(supportSignal(low, 3, 'Atlantic/Reykjavik', new Date('2026-09-19T21:00:00Z'))).toBe(
      false,
    );
  });
  it('does not trigger from many low entries in one day', () =>
    expect(supportSignal([low[2], low[2], low[2]], 3, 'Atlantic/Reykjavik', now)).toBe(false));
  it('uses all entries in daily averages', () =>
    expect(
      supportSignal([...low, entry('2026-09-16T19:00:00Z', 5)], 3, 'Atlantic/Reykjavik', now),
    ).toBe(false));
  it('ignores future entries and invalid thresholds', () => {
    expect(supportSignal([entry('2026-09-18T12:00:00Z', 1)], 3, 'Atlantic/Reykjavik', now)).toBe(
      false,
    );
    expect(supportSignal(low, 1, 'Atlantic/Reykjavik', now)).toBe(false);
  });
  it('uses calendar days in the chosen time zone across DST', () => {
    const times = [
      '2026-03-07T23:30:00-05:00',
      '2026-03-08T23:30:00-04:00',
      '2026-03-09T23:30:00-04:00',
    ].map((t) => entry(new Date(t).toISOString()));
    expect(supportSignal(times, 3, 'America/New_York', new Date('2026-03-10T04:00:00Z'))).toBe(
      true,
    );
    expect(dayKey('2026-09-18T00:30:00Z', 'America/New_York')).toBe('2026-09-17');
  });
});
describe('history and export correctness', () => {
  it('retains multiple observations on a day and leaves absent days empty', () => {
    const rows = [...low, entry('2026-09-17T19:00:00Z', 4)];
    const days = dailyMoods(rows, '2026-09-14', '2026-09-17', 'Atlantic/Reykjavik');
    expect(days[0]).toEqual({ date: '2026-09-14', average: null, count: 0 });
    expect(days[3]).toEqual({ date: '2026-09-17', average: 3, count: 2 });
    expect(filterMoods(rows, '2026-09-17', '2026-09-17', 'Atlantic/Reykjavik')).toHaveLength(2);
  });
  it('omits private notes by default', () => {
    expect(moodCsv(low)).not.toContain('Persónulegur texti');
    expect(moodCsv(low, true)).toContain('Persónulegur texti');
    expect(moodCsv(low).startsWith('\uFEFF')).toBe(true);
  });
  it('neutralizes CSV formula injection including whitespace and quotes', () => {
    for (const value of ['=SUM(1,2)', '\t=1+1', ' +cmd', '@test', '-1+1', '\r\n=evil'])
      expect(csvCell(value)).toMatch(/^"'/);
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it('produces private portable UTF-8 folded calendars with stable UID', () => {
    const a: Appointment = {
      id: crypto.randomUUID(),
      title: 'Læknir\nBEGIN:ATTACK,' + 'Þ'.repeat(90),
      location: 'Stofa;2',
      starts_at: '2026-09-20T10:00:00Z',
      duration_minutes: 30,
      reminder_minutes: 60,
    };
    const privateIcs = appointmentIcs(a);
    expect(privateIcs).not.toContain('Læknir');
    expect(privateIcs).toContain('SUMMARY:Frátekinn tími');
    const ics = appointmentIcs(a, true);
    expect(ics).toContain('DTEND:20260920T103000Z');
    expect(ics).toContain('TRIGGER:-PT60M');
    expect(ics).not.toContain('\r\nBEGIN:ATTACK');
    expect(ics).toContain('Læknir\\nBEGIN:ATTACK\\,');
    for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(appointmentIcs(a)).toBe(privateIcs);
  });
});
describe('input boundaries', () => {
  it('rejects future mood timestamps and out-of-range scores', () => {
    expect(moodSchema.safeParse({ ...low[0], score: 6 }).success).toBe(false);
    expect(moodSchema.safeParse({ ...low[0], occurred_at: '2099-01-01T00:00:00Z' }).success).toBe(
      false,
    );
  });
  it('requires specific consent and adult confirmation', () => {
    const p = {
      name: 'Próf',
      birth_year: 1982,
      timezone: 'Atlantic/Reykjavik',
      interests: [],
      comfort_activities: [],
      water_goal_ml: 1500,
      support_enabled: true,
      support_days: 3,
      health_consent: true,
      adult_confirmed: true,
      support_consent: false,
      onboarding_completed: true,
    };
    expect(profileSchema.safeParse(p).success).toBe(false);
    expect(profileSchema.safeParse({ ...p, support_consent: true }).success).toBe(true);
    expect(
      profileSchema.safeParse({ ...p, support_enabled: false, adult_confirmed: false }).success,
    ).toBe(false);
  });
  it('rejects impossible sleep durations and fake health data providers', () => {
    const value = {
      id: crypto.randomUUID(),
      kind: 'sleep',
      value: 30,
      source: 'manual',
      occurred_at: new Date().toISOString(),
    };
    expect(wellbeingSchema.safeParse(value).success).toBe(false);
    expect(wellbeingSchema.safeParse({ ...value, value: 8, source: 'healthkit' }).success).toBe(
      false,
    );
  });
  it('blocks push endpoint SSRF and lookalike hosts', () => {
    const keys = { p256dh: 'abc', auth: 'abc' };
    for (const endpoint of [
      'http://localhost/',
      'https://127.0.0.1/',
      'https://fcm.googleapis.com.evil.test/',
      'https://evil.test/?host=fcm.googleapis.com',
    ])
      expect(pushSchema.safeParse({ endpoint, keys }).success).toBe(false);
    expect(
      pushSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys }).success,
    ).toBe(true);
  });
});

describe('Icelandic formatting independent of browser locale', () => {
  it('uses Icelandic names and decimal separators', async () => {
    const { formatDate, shortWeekday, formatNumber } = await import('../src/lib/domain/format');
    expect(
      formatDate('2026-09-17T21:46:00Z', 'Atlantic/Reykjavik', {
        weekday: true,
        year: true,
        time: true,
      }),
    ).toBe('fimmtudagur, 17. september 2026 kl. 21:46');
    expect(shortWeekday('2026-09-17')).toBe('fim.');
    expect(formatNumber(1500, 0)).toBe('1.500');
    expect(formatNumber(7.5)).toBe('7,5');
  });
});
