import type { AppData, MoodEntry, MoodScore } from './domain/types';
export function demoData(): AppData {
  const now = new Date();
  const uid = '00000000-0000-4000-8000-000000000001';
  const moods: MoodEntry[] = [];
  const scores = [
    3, 4, 3, 2, 3, 4, 4, 3, 2, 3, 4, 4, 3, 4, 5, 4, 3, 4, 3, 4, 5, 4, 3, 4, 4, 3, 4, 5,
  ];
  scores.forEach((score, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (27 - i));
    date.setHours(8, 30, 0, 0);
    if (date > now) date.setTime(now.getTime() - 60000);
    moods.push({
      id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      score: score as MoodScore,
      energy: 3,
      emotions: score >= 4 ? ['Ró', 'Þakklæti'] : ['Þreyta'],
      note: i === 26 ? 'Góður göngutúr eftir vinnu.' : '',
      occurred_at: date.toISOString(),
    });
  });
  const today = new Date(now.getTime() - 3600000).toISOString();
  return {
    profile: {
      id: uid,
      name: 'Alex',
      birth_year: 1993,
      timezone: 'Atlantic/Reykjavik',
      interests: ['Tónlist', 'Göngutúrar', 'Náttúran'],
      comfort_activities: ['Hlusta á uppáhaldslagið mitt'],
      water_goal_ml: 1500,
      personal_notifications: false,
      support_enabled: false,
      support_days: 3,
      consent_at: null,
      health_consent_at: today,
      onboarding_completed: true,
    },
    moods,
    wellbeing: [
      {
        id: '20000000-0000-4000-8000-000000000001',
        kind: 'water',
        value: 750,
        source: 'manual',
        occurred_at: today,
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        kind: 'sleep',
        value: 7.5,
        source: 'manual',
        occurred_at: today,
      },
      {
        id: '20000000-0000-4000-8000-000000000003',
        kind: 'movement',
        value: 20,
        source: 'manual',
        occurred_at: today,
      },
    ],
    routines: [
      {
        id: '30000000-0000-4000-8000-000000000001',
        title: 'Staldra við og skrá líðan',
        kind: 'mood',
        times: ['20:00'],
        enabled: true,
      },
    ],
    routineLogs: [],
    appointments: [],
    contacts: [],
    notifications: [],
  };
}
