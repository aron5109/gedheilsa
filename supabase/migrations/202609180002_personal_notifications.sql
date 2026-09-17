-- Existing users keep discreet lock-screen notifications until they opt in.
alter table public.profiles
  add column personal_notifications boolean not null default false;
comment on column public.profiles.personal_notifications is
  'Opt-in to first-name greetings and general wellbeing reminders on the lock screen. Never includes mood entries, medicine names or appointment details.';
