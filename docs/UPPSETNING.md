# Uppsetning Hlýju

## 1. Staðbundin keyrsla

Node.js 24 LTS er notað í CI. Node 22 er einnig leyft. Keyrðu `npm ci`, afritaðu `.env.example` í `.env.local` og keyrðu `npm run dev`. `/demo` virkar án lykla. `/app` krefst innskráningar og raunverulegs gagnagrunns.

## 2. Supabase og gagnagrunnur

1. Stofnaðu sérstakt Supabase-prófunarverkefni. Veldu viðeigandi evrópska staðsetningu og staðfestu vinnslusamning/varðveislu áður en raunveruleg heilsugögn eru skráð.
2. Keyrðu `supabase/migrations/202609180001_initial.sql` í SQL Editor. Alternatíft: `supabase link --project-ref <verkefni>` og `supabase db push` með Supabase CLI.
3. Settu Project URL og publishable key í `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Settu service role lykilinn í `SUPABASE_SERVICE_ROLE_KEY` **aðeins á vefþjóninum**. Hann þarf fyrir staðfestingar aðstandenda, sendingarmörk, scheduler og eyðingu notanda.
5. Notaðu eigin prófunarreikninga. Staðfestu að reikningur A sjái ekki gögn B, einnig þegar beint er kallað á Supabase Data API.

Skráningar eru tengdar prófíl sem þarf að klára fyrst. Það er ekki tilbúinn notandi, fast netfang eða lykilorð í migration.

## 3. Google-innskráning

1. Í Google Cloud: stilltu OAuth consent screen og OAuth Client af gerðinni Web application. Skráðu raunverulegt appheiti, ábyrgðaraðila og persónuverndarslóð. Bættu við test users á meðan appið er í prófun.
2. Authorized redirect URI er Supabase callback-slóð verkefnisins: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Í Supabase Authentication → Sign In / Providers → Google: virkjaðu Google og settu Google Client ID og Client Secret þar. Google Client Secret fer ekki í Next.js eða GitHub.
4. Í Supabase URL Configuration: Site URL er raunveruleg slóð Hlýju. Leyfðu nákvæmlega `<app-url>/auth/callback` og `http://localhost:3000/auth/callback` fyrir þróun. Forðastu víða wildcard-a í framleiðslu.
5. Stilltu `NEXT_PUBLIC_APP_URL` á sama uppruna. Innskráning notar aðeins `openid email profile`; ekki er beðið um Gmail, Drive, Calendar eða heilsugögn frá Google.
6. Prófaðu nýjan notanda, innskráningu aftur, útrunnið token, útskráningu og neitað OAuth-samþykki.

Opinberar leiðbeiningar: [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## 4. Vefhýsing

Hægt er að nota Vercel eða Node-hýsingu sem styður Next.js App Router og server routes. Þetta er **ekki** static-export verkefni fyrir GitHub Pages.

Á Vercel: import `aron5109/gedheilsa`, Next.js preset, Node 24, build `npm run build`, og umhverfisbreytur úr `.env.example`. Hafðu sér Supabase-prófunarverkefni fyrir preview deployment. Stilltu endanlega slóð og OAuth allowlist áður en innskráning er prófuð. Breyting á `NEXT_PUBLIC_*` þarf nýtt build.

Uppsetning á hýsingu er ekki framkvæmd með því einu að ýta kóðanum á GitHub. Verkefnið inniheldur ekki virka þjónustulykla.

## 5. Tölvupóstur

1. Stofnaðu Resend-verkefni og staðfestu eigið sendingarlén með DNS.
2. Settu `RESEND_API_KEY` og raunverulegt `EMAIL_FROM`, t.d. `Hlýja <hlyja@þitt-lén.is>`.
3. Staðfestu vinnslu- og varðveisluskilmála þjónustunnar fyrir þau gögn sem send eru. Venjulegur tölvupóstur er ekki dulkóðuð sjúklingagátt.
4. Prófaðu boð í netfang sem þú stjórnar. Opnun hlekks samþykkir ekki sjálfkrafa; viðtakandinn ýtir sérstaklega á samþykkja.
5. Prófaðu afskráningarhlekk og staðfestu að engar nýjar stuðningsbeiðnir séu sendar eftir afskráningu.
6. Prófaðu CSV-sendingu með tilbúnum færslum. Viðtakandi og val um dagbókartexta eru staðfest sérstaklega.

Stuðningsboð og útflutningur hafa mörk á fjölda sendinga á klukkustund. Útflutningur er að hámarki 5 MB í tölvupósti. Sendingarprófun er ekki framkvæmd sjálfkrafa við deployment.

## 6. Tilkynningar og tímaáætlanir

```bash
npx web-push generate-vapid-keys
openssl rand -hex 32
```

Settu opinbera VAPID-lykilinn í `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, einkalykil í `VAPID_PRIVATE_KEY`, tengilið í `VAPID_SUBJECT` (t.d. `mailto:rekstur@example.is`) og slembilykil í `CRON_SECRET`.

**Nauðsynlegt:** settu upp áreiðanlega tímastýringu sem kallar á `GET <app-url>/api/cron` á fimm mínútna fresti með `Authorization: Bearer <CRON_SECRET>`. Geymdu lykilinn í secrets-stillingum hýsingar, ekki í URL. Veldu áskrift/hýsingu sem leyfir þessa tíðni. GitHub Actions er ekki notað sem lyfjaáminningaklukka.

Vercel getur sent `CRON_SECRET` sjálft í Authorization þegar Vercel Cron er notað. Bættu eftirfarandi við Vercel-stillingar verkefnisins þegar viðeigandi áskrift hefur verið staðfest:

```json
{ "crons": [{ "path": "/api/cron", "schedule": "*/5 * * * *" }] }
```

Scheduler skoðar tíu mínútna glugga, stofnar einstök jobs, tekur þau með `FOR UPDATE SKIP LOCKED` og endursendir tímabundnar bilanir. Engar stórar bunur af gömlum lyfjaáminningum eru sendar eftir langt rof. Tilkynning getur komið nokkrum mínútum eftir valinn tíma; kerfið er ekki ætlað tímaháðri lyfjagjöf.

Notandi virkjar tilkynningar sérstaklega í **Mitt rými**. Á iPhone er Home Screen uppsetning forsenda Web Push á studdum útgáfum. Vafrakerfi geta hindrað eða tafið tilkynningar. Prófaðu raunveruleg tæki og leyfisstillingar.

## 7. Dagatöl og næstu tengingar

`.ics` skrá virkar til innflutnings í Apple Calendar/iCal og önnur studd dagatöl. Google-hlekkurinn opnar viðburð sem notandinn staðfestir í Google Calendar; það er dagatalið sem Android-notandinn samstillir við símann sinn. Þetta er ekki hljóðlaus bein skrifaðgerð á tækið.

Heiti er sjálfgefið „Frátekinn tími“. Heiti/staðsetning fylgja aðeins ef notandi velur það. Skráin inniheldur einka-merkingu og áminningu, en dagatalsforritið ræður hvort það tekur við áminningunni. Eyðing í Hlýju eyðir ekki þegar innfluttum viðburði. Ekki er sífelld tvíhliða dagatalssamstilling í þessari útgáfu.

## 8. Áður en raunveruleg notkun hefst

Fylgdu [rekstrar- og útgáfugátlista](REKSTUR.md). Náðu fyrst góðum árangri með tilbúnum gögnum, síðan með afmörkuðum, upplýstum prófunarhópi eftir viðeigandi yfirferð.
