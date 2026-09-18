-- New Neon schema; never alters existing Supabase tables.
create schema if not exists hlyja;
do $$ begin
 if to_regclass('neon_auth."user"') is null then
  raise exception 'Enable Managed Better Auth on this Neon branch before running migrations.';
 end if;
 if not exists(select 1 from pg_roles where rolname='hlyja_user') then create role hlyja_user nologin nobypassrls; end if;
 if not exists(select 1 from pg_roles where rolname='hlyja_worker') then create role hlyja_worker nologin nobypassrls; end if;
 execute format('grant hlyja_user,hlyja_worker to %I',current_user);
end $$;
grant usage on schema hlyja to hlyja_user,hlyja_worker;
create function hlyja.current_user_id() returns uuid language sql stable set search_path='' as $$
 select nullif(current_setting('app.user_id',true),'')::uuid
$$;
revoke all on function hlyja.current_user_id() from public;
grant execute on function hlyja.current_user_id() to hlyja_user,hlyja_worker;
create function hlyja.valid_timezone(zone text) returns boolean
language sql stable set search_path='' as $$ select exists(select 1 from pg_catalog.pg_timezone_names where name=zone) $$;
create function hlyja.valid_text_items(items text[], max_chars integer) returns boolean
language sql immutable set search_path='' as $$ select coalesce(bool_and(char_length(v) between 1 and max_chars),true) from unnest(items) v $$;
create function hlyja.valid_daily_times(items text[]) returns boolean
language sql immutable set search_path='' as $$ select coalesce(bool_and(v ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),false) from unnest(items) v $$;
create table hlyja.profiles (
 id uuid primary key references neon_auth."user"(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 birth_year integer check (birth_year between 1900 and 2100),
 timezone text not null default 'Atlantic/Reykjavik' check(hlyja.valid_timezone(timezone)),
 interests text[] not null default '{}', comfort_activities text[] not null default '{}',
 personal_notifications boolean not null default false,
 water_goal_ml integer not null default 1500 check (water_goal_ml between 250 and 6000),
 support_enabled boolean not null default false,
 support_days integer not null default 3 check (support_days between 3 and 14),
 consent_at timestamptz, health_consent_at timestamptz not null,
 onboarding_completed boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (not support_enabled or consent_at is not null),
 check (cardinality(interests)<=20 and cardinality(comfort_activities)<=20),
 check (hlyja.valid_text_items(interests,80) and hlyja.valid_text_items(comfort_activities,160))
);
create table hlyja.mood_entries (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 score smallint not null check (score between 1 and 5), energy smallint not null check (energy between 1 and 5),
 emotions text[] not null default '{}' check (cardinality(emotions)<=12 and hlyja.valid_text_items(emotions,40)), note text not null default '' check (char_length(note)<=4000),
 occurred_at timestamptz not null, created_at timestamptz not null default now(),
 check (occurred_at<=created_at+interval '1 minute')
);
create index mood_user_time on hlyja.mood_entries(user_id,occurred_at desc);
create table hlyja.wellbeing_entries (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 kind text not null check (kind in ('water','sleep','movement','steps')), value numeric not null,
 source text not null default 'manual' check (source in ('manual','health_connect','healthkit')),
 external_id text, occurred_at timestamptz not null, created_at timestamptz not null default now(),
 check (value>=0 and value<=case kind when 'sleep' then 24 when 'water' then 5000 when 'movement' then 1440 else 100000 end),
 check (source='manual' or external_id is not null), check (occurred_at<=created_at+interval '1 minute'),
 unique(user_id,source,external_id)
);
create index wellbeing_user_time on hlyja.wellbeing_entries(user_id,occurred_at desc);
create table hlyja.routines (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 120),
 kind text not null check(kind in ('medication','mood','water','sleep')),
 times text[] not null check(cardinality(times) between 1 and 8 and hlyja.valid_daily_times(times)), enabled boolean not null default true,
 created_at timestamptz not null default now(), unique(id,user_id)
);
create table hlyja.routine_logs (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 routine_id uuid not null, scheduled_date date not null, scheduled_time text not null check(scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 status text not null check(status in ('taken','skipped')), created_at timestamptz not null default now(),
 foreign key (routine_id,user_id) references hlyja.routines(id,user_id) on delete cascade,
 unique(user_id,routine_id,scheduled_date,scheduled_time)
);
create table hlyja.appointments (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 160), starts_at timestamptz not null,
 duration_minutes integer not null check(duration_minutes between 5 and 480),
 location text not null default '' check(char_length(location)<=200), reminder_minutes integer not null default 60 check(reminder_minutes between 5 and 10080),
 created_at timestamptz not null default now()
);
create table hlyja.trusted_contacts (
 id uuid primary key, user_id uuid not null references hlyja.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80), email text not null check(char_length(email)<=254),
 verified_at timestamptz, enabled boolean not null default true, consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(), unique(user_id,email)
);
create table hlyja.contact_tokens (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references hlyja.trusted_contacts(id) on delete cascade,
 token_hash text not null unique, purpose text not null check(purpose in ('verify','revoke')),
 expires_at timestamptz not null, consumed_at timestamptz
);
create table hlyja.push_subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references hlyja.profiles(id) on delete cascade,
 endpoint text not null, subscription jsonb not null, created_at timestamptz not null default now(), unique(user_id,endpoint)
);
create table hlyja.notification_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references hlyja.profiles(id) on delete cascade,
 contact_id uuid references hlyja.trusted_contacts(id) on delete cascade,
 kind text not null check(kind in ('support','routine','appointment')),
 dedupe_key text not null unique, payload jsonb not null default '{}',
 status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
 attempts integer not null default 0, due_at timestamptz not null default now(),
 expires_at timestamptz not null, locked_at timestamptz, sent_at timestamptz,
 created_at timestamptz not null default now()
);
create index jobs_queue on hlyja.notification_jobs(status,due_at);
create table hlyja.rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
create function hlyja.consume_rate_limit(rate_key text, max_hits integer, window_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into hlyja.rate_limits as r (key,hits,expires_at) values(rate_key,1,now()+make_interval(secs=>window_seconds))
 on conflict(key) do update set hits=case when r.expires_at<now() then 1 else r.hits+1 end,
 expires_at=case when r.expires_at<now() then now()+make_interval(secs=>window_seconds) else r.expires_at end returning hits into n;
 return n<=max_hits;
end; $$;
-- Serialize cooldown checks per contact, including concurrent schedulers at midnight.
create function hlyja.enqueue_support_job(owner_id uuid, recipient_id uuid, job_key text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from hlyja.trusted_contacts where id=recipient_id and user_id=owner_id and enabled=true and verified_at is not null for update;
 if not found then return false; end if;
 if not exists(select 1 from hlyja.profiles where id=owner_id and support_enabled=true and consent_at is not null) then return false; end if;
 if exists(select 1 from hlyja.notification_jobs where contact_id=recipient_id and kind='support' and status in('pending','processing','sent') and created_at>now()-interval '7 days') then return false; end if;
 insert into hlyja.notification_jobs(user_id,contact_id,kind,dedupe_key,expires_at) values(owner_id,recipient_id,'support',job_key,now()+interval '12 hours') on conflict(dedupe_key) do nothing;
 return found;
end; $$;
create function hlyja.claim_notification_jobs(batch_size integer default 50) returns setof hlyja.notification_jobs
language plpgsql security definer set search_path='' as $$
begin
 update hlyja.notification_jobs set status='cancelled' where expires_at<=now() and status in ('pending','processing');
 update hlyja.notification_jobs set status='failed' where attempts>=5 and status in ('pending','processing') and (locked_at is null or locked_at<now()-interval '5 minutes');
 return query update hlyja.notification_jobs j set status='processing',locked_at=now(),attempts=j.attempts+1
 where j.id in (select q.id from hlyja.notification_jobs q where q.due_at<=now() and q.expires_at>now() and q.attempts<5 and
 (q.status='pending' or(q.status='processing' and q.locked_at<now()-interval '5 minutes')) order by q.created_at for update skip locked limit least(batch_size,100)) returning j.*;
end; $$;
create function hlyja.consume_contact_token(hash text, action text) returns boolean
language plpgsql security definer set search_path='' as $$
declare contact uuid;
begin
 update hlyja.contact_tokens set consumed_at=now() where token_hash=hash and purpose=action and consumed_at is null and expires_at>now() returning contact_id into contact;
 if contact is null then return false; end if;
 if action='verify' then
 update hlyja.trusted_contacts set verified_at=now() where id=contact and enabled=true;
 if not found then return false; end if;
 elsif action='revoke' then
 update hlyja.trusted_contacts set enabled=false,verified_at=null where id=contact;
 update hlyja.notification_jobs set status='cancelled' where contact_id=contact and status in('pending','processing');
 end if;
 return true;
end; $$;
-- Account closure is explicit and available only through the hlyja_user server route.
create function hlyja.delete_own_data() returns void language plpgsql security invoker set search_path='' as $$
begin delete from hlyja.profiles where id=(select hlyja.current_user_id()); end; $$;
-- Every table is RLS protected. Authenticated users can never set contact verification,
-- queue deliveries, read other users, or alter historical mood measurements.
do $$ declare t text; begin
 foreach t in array array['profiles','mood_entries','wellbeing_entries','routines','routine_logs','appointments','trusted_contacts','contact_tokens','push_subscriptions','notification_jobs','rate_limits'] loop
 execute format('alter table hlyja.%I enable row level security',t);
 execute format('revoke all on hlyja.%I from public, hlyja_user',t);
 end loop;
end $$;
grant select,insert,update,delete on hlyja.profiles to hlyja_user;
create policy profile_own on hlyja.profiles for all to hlyja_user using(id=(select hlyja.current_user_id())) with check(id=(select hlyja.current_user_id()));
do $$ declare t text; begin
 foreach t in array array['mood_entries','wellbeing_entries','routine_logs'] loop
 execute format('grant select,insert on hlyja.%I to hlyja_user',t);
 execute format('create policy own_read on hlyja.%I for select to hlyja_user using(user_id=(select hlyja.current_user_id()))',t);
 execute format('create policy own_insert on hlyja.%I for insert to hlyja_user with check(user_id=(select hlyja.current_user_id()))',t);
 end loop;
 foreach t in array array['routines','appointments','push_subscriptions'] loop
 execute format('grant select,insert,update,delete on hlyja.%I to hlyja_user',t);
 execute format('create policy own_data on hlyja.%I for all to hlyja_user using(user_id=(select hlyja.current_user_id())) with check(user_id=(select hlyja.current_user_id()))',t);
 end loop;
end $$;
grant select on hlyja.trusted_contacts to hlyja_user;
create policy own_contacts on hlyja.trusted_contacts for select to hlyja_user using(user_id=(select hlyja.current_user_id()));
grant select(id,user_id,kind,status,created_at,sent_at) on hlyja.notification_jobs to hlyja_user;
create policy own_job_status on hlyja.notification_jobs for select to hlyja_user using(user_id=(select hlyja.current_user_id()));
revoke all on function hlyja.consume_rate_limit(text,integer,integer) from public,hlyja_user;
revoke all on function hlyja.enqueue_support_job(uuid,uuid,text) from public,hlyja_user;
revoke all on function hlyja.claim_notification_jobs(integer) from public,hlyja_user;
revoke all on function hlyja.consume_contact_token(text,text) from public,hlyja_user;
revoke all on function hlyja.delete_own_data() from public;
grant execute on function hlyja.enqueue_support_job(uuid,uuid,text) to hlyja_worker;
grant execute on function hlyja.consume_rate_limit(text,integer,integer),hlyja.claim_notification_jobs(integer),hlyja.consume_contact_token(text,text) to hlyja_worker;
grant execute on function hlyja.delete_own_data() to hlyja_user;
-- Worker requests are only constructed inside authenticated server routes or the cron job.
-- No runtime request executes queries as the schema owner.
do $$ declare t text; begin
 foreach t in array array['profiles','mood_entries','wellbeing_entries','routines','routine_logs','appointments','trusted_contacts','contact_tokens','push_subscriptions','notification_jobs','rate_limits'] loop
  execute format('grant select,insert,update,delete on hlyja.%I to hlyja_worker',t);
  execute format('create policy worker_access on hlyja.%I for all to hlyja_worker using(true) with check(true)',t);
 end loop;
end $$;
