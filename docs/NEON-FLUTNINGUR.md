# Neon-flutningur

Kóðinn notar Neon PostgreSQL og Managed Better Auth. Supabase-tengingar og runtime-pakkar hafa verið fjarlægðir; eldri migrations eru varðveittar sem saga. Viðmót og biðröð skráninga nota áfram sömu gagnasnið.

## Sannreynt 18. september 2026

- `202609180001_neon.sql` var prófuð á `hlyja-migration-validation` áður en hún var keyrð á `main` í Neon-verkefninu `neon-pink-fountain`.
- Migration-saga og SHA-256 eru skráð í `public.hlyja_migrations`. `npm run db:migrate` sleppir þegar keyrðum, óbreyttum skrám. Endurkeyrsla var prófuð á prófunargreininni.
- Allar 11 app-töflur nota RLS. Raunveruleg Neon HTTP-tenging með transaction-local hlutverki og tómu notandasamhengi var prófuð.
- 68 eininga- og gagnagrunnspróf, þar á meðal API með PostgreSQL-vél, prófa einangrun, endursendingu, 1.006 færslna útflutning, samþykki, session og eyðingartengsl.
- 14 Chromium-próf kanna viðmót og aðgengi. Full CI keyrir einnig WebKit.
- Upphaf Google-innskráningar var prófað með raunverulegri Neon Auth-prófunargrein. Beiðnin skilaði tilvísun áfram og tveimur innskráningarkökum. Heilli Google-innskráningu var ekki lokið fyrir hönd notanda.

## Eftir í hýsingu

Vercel-tengingin í vinnuumhverfinu skilaði engu teymi og `403 Forbidden` fyrir `hausverkur-7838s-projects/gedheilsa`. Því voru umhverfisbreytur og endanlegt innskráningarflæði á Vercel ekki sannreynd í þessari vinnulotu.

Staðfesta þarf `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` og `NEXT_PUBLIC_APP_URL` í réttu Vercel-umhverfi, bæta nákvæmum uppruna við Neon Auth Trusted domains og endurútgefa. Sjá [uppsetningu](UPPSETNING.md).

Tölvupóstur, Web Push og cron þurfa áfram eigin uppsetningu og prófun. Þessi breyting flytur ekki sjálfkrafa eldri Supabase-notendur eða gögn. Engin raunveruleg heilsugögn voru flutt, birt eða send með tölvupósti.
