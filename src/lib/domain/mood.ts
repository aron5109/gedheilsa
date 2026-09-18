import { calendarParts } from './format';
import type { MoodEntry, MoodScore, Profile } from './types';
export const MOODS: { score: MoodScore; label: string; color: string; soft: string }[] = [
  { score: 1, label: 'Mjög illa', color: '#a64f48', soft: '#f8e5e0' },
  { score: 2, label: 'Illa', color: '#a86c39', soft: '#faebd9' },
  { score: 3, label: 'Ágætlega', color: '#8c7730', soft: '#f7f0d5' },
  { score: 4, label: 'Vel', color: '#417863', soft: '#e0eee5' },
  { score: 5, label: 'Mjög vel', color: '#567b99', soft: '#e2edf5' },
];
export const EMOTIONS = [
  'Ró',
  'Gleði',
  'Þakklæti',
  'Von',
  'Kvíði',
  'Sorg',
  'Þreyta',
  'Einmanaleiki',
  'Pirringur',
  'Streita',
  'Orka',
  'Óvissa',
];
export const INTERESTS = [
  'Göngutúrar',
  'Tónlist',
  'Sund',
  'Náttúran',
  'Bækur',
  'Matreiðsla',
  'Fjölskyldan',
  'Vinir',
  'Gæludýr',
  'Sköpun',
  'Leikir',
  'Kyrrð',
];
export function dayKey(date: Date | string, timezone = 'Atlantic/Reykjavik'): string {
  const p = calendarParts(date, timezone);
  return `${p.year}-${p.month}-${p.day}`;
}
export function addDays(key: string, amount: number) {
  const date = new Date(key + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function localTime(date: Date, timezone: string) {
  const p = calendarParts(date, timezone);
  return `${p.hour}:${p.minute}`;
}
export function localDateTime(date: Date, timezone: string) {
  return `${dayKey(date, timezone)}T${localTime(date, timezone)}`;
}
// Uses calendar days with actual observations; never treats an absent entry as distress.
// This user-chosen rule is not a clinical threshold or a crisis prediction.
export function supportSignal(
  entries: MoodEntry[],
  days: number,
  timezone: string,
  now = new Date(),
): boolean {
  if (days < 3 || days > 14) return false;
  const eligible = entries
    .filter((e) => new Date(e.occurred_at) <= now)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const latest = eligible[0];
  if (
    !latest ||
    latest.score > 2 ||
    now.getTime() - new Date(latest.occurred_at).getTime() > 24 * 60 * 60 * 1000
  )
    return false;
  const lastDay = dayKey(latest.occurred_at, timezone);
  for (let i = 0; i < days; i++) {
    const records = eligible.filter(
      (e) => dayKey(e.occurred_at, timezone) === addDays(lastDay, -i),
    );
    if (!records.length || records.reduce((sum, e) => sum + e.score, 0) / records.length > 2)
      return false;
  }
  return true;
}
export function filterMoods(entries: MoodEntry[], from: string, to: string, timezone: string) {
  return entries
    .filter((e) => {
      const key = dayKey(e.occurred_at, timezone);
      return key >= from && key <= to;
    })
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
}
export function dailyMoods(entries: MoodEntry[], from: string, to: string, timezone: string) {
  const result: { date: string; average: number | null; count: number }[] = [];
  const totals = new Map<string, { sum: number; count: number }>();
  for (const entry of entries) {
    const key = dayKey(entry.occurred_at, timezone);
    const value = totals.get(key) ?? { sum: 0, count: 0 };
    value.sum += entry.score;
    value.count += 1;
    totals.set(key, value);
  }
  for (let key = from; key <= to; key = addDays(key, 1)) {
    const value = totals.get(key);
    result.push({
      date: key,
      average: value ? value.sum / value.count : null,
      count: value?.count ?? 0,
    });
  }
  return result;
}
export function suggestions(profile: Profile | null, score?: number) {
  const interests = profile?.interests ?? [];
  const personal = profile?.comfort_activities?.[0];
  return [
    {
      title:
        personal ||
        (interests.includes('Tónlist') ? 'Eitt lag sem þér þykir vænt um' : 'Smá stund fyrir þig'),
      description: personal
        ? 'Þetta er eitt af því sem þú nýtur. Kannski er gott að gefa því smá stund í dag.'
        : 'Settu á lag sem þér þykir vænt um og hlustaðu í rólegheitum.',
      time: '5 mín.',
      icon: 'music',
    },
    {
      title: interests.includes('Gæludýr') ? 'Stund með dýrinu þínu' : 'Fáðu örlítið ferskt loft',
      description: interests.includes('Gæludýr')
        ? 'Kannski er gott að sitja hjá dýrinu þínu eða leika smá stund, ef það hentar.'
        : score && score <= 2
          ? 'Lítið skref má vera nóg. Opnaðu glugga eða stígðu út ef það hentar þér.'
          : 'Stuttur göngutúr á þínum hraða. Þú ræður hversu langt þú ferð.',
      time: '5–10 mín.',
      icon: 'leaf',
    },
    {
      title: 'Heyrðu í einhverjum sem þér þykir vænt um',
      description: 'Stutt skilaboð til manneskju sem þér líður vel með geta verið góð byrjun.',
      time: 'Á þínum hraða',
      icon: 'heart',
    },
  ];
}
