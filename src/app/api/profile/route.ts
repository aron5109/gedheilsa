import { guard, json, failure, body } from '@/lib/server/http';
import { profileSchema } from '@/lib/domain/validation';
export async function POST(request: Request) {
  try {
    const { db, user } = await guard(request, true);
    const v = await body(request, profileSchema);
    const [data] = await db.query(
      `insert into hlyja.profiles
      (id,name,birth_year,timezone,interests,comfort_activities,water_goal_ml,personal_notifications,support_enabled,support_days,health_consent_at,consent_at)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),case when $9 then now() else null end)
      on conflict(id) do update set name=excluded.name,birth_year=excluded.birth_year,timezone=excluded.timezone,
      interests=excluded.interests,comfort_activities=excluded.comfort_activities,water_goal_ml=excluded.water_goal_ml,
      personal_notifications=excluded.personal_notifications,support_enabled=excluded.support_enabled,support_days=excluded.support_days,
      consent_at=case when excluded.support_enabled then coalesce(hlyja.profiles.consent_at,now()) else null end, updated_at=now()
      returning *`,
      [
        user.id,
        v.name,
        v.birth_year,
        v.timezone,
        v.interests,
        v.comfort_activities,
        v.water_goal_ml,
        v.personal_notifications,
        v.support_enabled,
        v.support_days,
      ],
    );
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
