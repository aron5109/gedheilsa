import { describe, expect, it } from 'vitest';
import { DAILY_WORDS, DAILY_FACTS, dailyContent } from '../src/lib/domain/daily-content';
import { addDays, dayKey } from '../src/lib/domain/mood';
import {
  reminderMessage,
  actionFromQuery,
  type ReminderKind,
} from '../src/lib/domain/notifications';
import { registrationCount } from '../src/lib/domain/format';

describe('daily Icelandic content', () => {
  it('keeps the same content through the day and changes at month/year boundaries', () => {
    const day = '2026-12-31';
    expect(dailyContent(day)).toEqual(dailyContent(day));
    expect(dailyContent(day).words).not.toEqual(dailyContent(addDays(day, 1)).words);
    expect(dailyContent(day).fact.id).not.toEqual(dailyContent(addDays(day, 1)).fact.id);
    expect(() => dailyContent('2026-02-30')).toThrow();
  });
  it('rotates every original message without repetition for a full cycle', () => {
    const words = Array.from(
      { length: DAILY_WORDS.length },
      (_, i) => dailyContent(addDays('2026-09-17', i)).words,
    );
    expect(new Set(words).size).toBe(31);
    const facts = Array.from(
      { length: DAILY_FACTS.length },
      (_, i) => dailyContent(addDays('2026-09-17', i)).fact.id,
    );
    expect(new Set(facts).size).toBe(12);
  });
  it('uses the chosen timezone, including a repeated DST hour', () => {
    const now = '2026-09-18T00:30:00Z';
    expect(dailyContent(dayKey(now, 'America/New_York'))).toEqual(dailyContent('2026-09-17'));
    expect(dailyContent(dayKey(now, 'Atlantic/Reykjavik'))).toEqual(dailyContent('2026-09-18'));
    expect(dailyContent(dayKey('2026-11-01T05:30:00Z', 'America/New_York'))).toEqual(
      dailyContent(dayKey('2026-11-01T06:30:00Z', 'America/New_York')),
    );
  });
  it('uses Icelandic singular counts including 21, but not 11', () => {
    expect(registrationCount(1)).toBe('1 skráning');
    expect(registrationCount(11)).toBe('11 skráningar');
    expect(registrationCount(21)).toBe('21 skráning');
    expect(registrationCount(0)).toBe('0 skráningar');
  });
});
describe('personal reminders', () => {
  const profile = {
    name: 'Aron Þór Guðmundsson',
    timezone: 'Atlantic/Reykjavik',
    personal_notifications: true,
  };
  it('uses a first-name greeting and an open mood question', () => {
    const result = reminderMessage(profile, 'mood', new Date('2026-09-17T10:00:00Z'));
    expect(result.body).toMatch(/^Hæ, Aron\./);
    expect(result.body).not.toContain('Þór');
    expect(result.body).not.toContain('ertu ekki');
    expect(result.url).toBe('/app?skra=lidan');
  });
  it('honors current opt-out for every reminder type and omits health details', () => {
    for (const kind of ['mood', 'water', 'sleep', 'medication', 'appointment'] as ReminderKind[]) {
      const result = reminderMessage({ ...profile, personal_notifications: false }, kind);
      expect(result.body).toBe('Þín stund í Hlýju. Opnaðu appið þegar það hentar þér.');
      expect(result.body).not.toContain('Aron');
    }
    expect(reminderMessage(profile, 'medication').body).not.toMatch(/lyf|skammt/);
  });
  it('cleans control characters, handles blank names, and bounds greeting length', () => {
    expect(reminderMessage({ ...profile, name: '\u202eAron\n Þór' }, 'water').body).toMatch(
      /^Hæ, Aron\./,
    );
    expect(reminderMessage({ ...profile, name: '  ' }, 'water').body).toMatch(/^Hæ\. /);
    expect(reminderMessage({ ...profile, name: 'A'.repeat(80) }, 'mood').body.length).toBeLessThan(
      240,
    );
  });
  it('accepts only known deep links', () => {
    expect(actionFromQuery({ skra: 'lidan' })).toBe('mood');
    expect(actionFromQuery({ skra: 'vatn' })).toBe('water');
    expect(actionFromQuery({ sida: 'aminningar' })).toBe('reminders');
    expect(actionFromQuery({ skra: 'toString' })).toBeUndefined();
    expect(actionFromQuery({ skra: 'https://other.invalid' })).toBeUndefined();
  });
});
