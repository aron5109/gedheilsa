import { dayIndex } from './daily-content';
import { dayKey } from './mood';
import type { Profile, Routine } from './types';

export type ReminderKind = Routine['kind'] | 'appointment';
export type AppAction = 'mood' | 'water' | 'sleep' | 'reminders';
export function actionFromQuery(query: { skra?: string; sida?: string }): AppAction | undefined {
  if (query.sida === 'aminningar') return 'reminders';
  switch (query.skra) {
    case 'lidan':
      return 'mood';
    case 'vatn':
      return 'water';
    case 'svefn':
      return 'sleep';
    default:
      return undefined;
  }
}
const urls: Record<ReminderKind, string> = {
  mood: '/app?skra=lidan',
  water: '/app?skra=vatn',
  sleep: '/app?skra=svefn',
  medication: '/app?sida=aminningar',
  appointment: '/app?sida=aminningar',
};
const moodInvitations = [
  'Hvernig líður þér í dag? Gefðu þér augnablik og skráðu líðan.',
  'Hvernig hefurðu það núna? Hér er pláss fyrir alla líðan.',
  'Eigum við að staldra aðeins við? Skráðu hvernig þér líður.',
];
export function reminderMessage(
  profile: Pick<Profile, 'name' | 'timezone' | 'personal_notifications'>,
  kind: ReminderKind,
  now = new Date(),
) {
  // Build at delivery time from current consent, never from queued private text.
  if (!profile.personal_notifications)
    return {
      title: 'Hlýja',
      body: 'Þín stund í Hlýju. Opnaðu appið þegar það hentar þér.',
      url: urls[kind],
    };
  const name = profile.name
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim()
    .split(/\s+/)[0]
    .slice(0, 40);
  const greeting = name ? `Hæ, ${name}.` : 'Hæ.';
  const body = {
    mood: moodInvitations[dayIndex(dayKey(now, profile.timezone), moodInvitations.length)],
    water: 'Hvernig væri að fá sér vatnssopa? Þú getur skráð vatnið þitt hér.',
    sleep: 'Tími fyrir rólega stund? Þú getur líka skráð svefninn þinn hér.',
    medication: 'Þú átt áminningu sem þú valdir. Kíktu inn þegar það hentar.',
    appointment: 'Þú átt bráðum bókaðan tíma. Upplýsingarnar bíða þín í Hlýju.',
  }[kind];
  return { title: 'Hlýja', body: `${greeting} ${body}`, url: urls[kind] };
}
