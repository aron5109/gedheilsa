export type MoodScore = 1 | 2 | 3 | 4 | 5;
export type Profile = {
  id: string;
  name: string;
  birth_year: number | null;
  timezone: string;
  interests: string[];
  comfort_activities: string[];
  water_goal_ml: number;
  personal_notifications: boolean;
  support_enabled: boolean;
  support_days: number;
  consent_at: string | null;
  health_consent_at: string;
  onboarding_completed: boolean;
};
export type MoodEntry = {
  id: string;
  user_id?: string;
  score: MoodScore;
  energy: number;
  emotions: string[];
  note: string;
  occurred_at: string;
  created_at?: string;
};
export type WellbeingEntry = {
  id: string;
  kind: 'water' | 'sleep' | 'movement' | 'steps';
  value: number;
  occurred_at: string;
  source: 'manual' | 'health_connect' | 'healthkit';
  external_id?: string | null;
};
export type Routine = {
  id: string;
  title: string;
  kind: 'medication' | 'mood' | 'water' | 'sleep';
  times: string[];
  enabled: boolean;
};
export type RoutineLog = {
  id: string;
  routine_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'taken' | 'skipped';
  created_at?: string;
};
export type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  location: string;
  reminder_minutes: number;
  created_at?: string;
};
export type Contact = {
  id: string;
  name: string;
  email: string;
  verified_at: string | null;
  enabled: boolean;
  created_at?: string;
};
export type NotificationJob = {
  id: string;
  kind: string;
  status: string;
  created_at: string;
  sent_at: string | null;
};
export type AppData = {
  profile: Profile | null;
  moods: MoodEntry[];
  wellbeing: WellbeingEntry[];
  routines: Routine[];
  routineLogs: RoutineLog[];
  appointments: Appointment[];
  contacts: Contact[];
  notifications: NotificationJob[];
};
export type QueuedEntry = {
  id: string;
  owner: string;
  kind: 'mood' | 'wellbeing';
  payload: MoodEntry | WellbeingEntry;
  queuedAt: string;
};
export const EMPTY_DATA: AppData = {
  profile: null,
  moods: [],
  wellbeing: [],
  routines: [],
  routineLogs: [],
  appointments: [],
  contacts: [],
  notifications: [],
};
