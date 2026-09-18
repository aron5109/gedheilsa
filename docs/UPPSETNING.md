# Uppsetning Hlýju

## 1. Staðbundin keyrsla

Node.js 24 LTS er notað í CI. Node 22 er einnig leyft. Keyrðu `npm ci`, afritaðu `.env.example` í `.env.local` og keyrðu `npm run dev`. `/demo` virkar án lykla. `/app` krefst innskráningar og raunverulegs gagnagrunns.

`npm run typecheck` kallar beint á TypeScript 7 í `@typescript/native`, svo uppsetningarröð npm ráði ekki hvaða `tsc` keyrir. TypeScript 6-samhæfingarpakkinn veitir JavaScript API sem ESLint og Next.js þurfa enn. Báðar útgáfur eru settar upp með npm-alias samkvæmt [leiðbeiningum TypeScript](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0). Ekki skipta `typescript`-aliasinu beint yfir í útgáfu 7 fyrr en þessi verkfæri styðja nýja API-ið; það stöðvar gæðaprófanir.

## 2. Neon og gagnagrunnur

1. Tengdu Neon-verkefnið við Vercel. `DATABASE_URL` er aðeins á vefþjóni; enginn gagnagrunnslykill fer í vafrann. Notaðu eigin Neon-grein fyrir Preview og staðbundnar prófanir.
2. Virkjaðu Neon Auth (Managed Better Auth) á sömu grein. SQL-líkanið vísar í `neon_auth."user"` og varðveitir aðskilnað notenda með PostgreSQL RLS.
3. Settu beina tengislóð í `DATABASE_URL_UNPOOLED` (án `-pooler`) og keyrðu `npm run db:migrate`. Skrár í `db/migrations/` eru framkvæmdar í einni færslu með lás og SHA-256-samanburði. Mistök afturkalla alla keyrsluna. Migration keyrir aldrei sjálfkrafa við build.
4. Settu Auth URL greinarinnar í `NEON_AUTH_BASE_URL`. Búðu til `NEON_AUTH_COOKIE_SECRET` með `openssl rand -hex 32`; geymdu í Vercel Secrets, ekki GitHub. Allar vélar sama deployment þurfa sama lykil.
5. Prófaðu `node --env-file=.env.local scripts/verify-neon.mjs`. Þetta les aðeins fjölda raða fyrir tóman prófunareiganda og birtir engin notendagögn.

`hlyja` schema geymir appgögn. `hlyja_user` hefur aðeins aðgang að eigin gögnum; `hlyja_worker` sér um afmarkaðar þjónustuaðgerðir. SQL-færslur nota bæði `SET LOCAL ROLE` og transaction-local notandaauðkenni, líka yfir pooled-tengingu. Settu aldrei gagnagrunnstengislóð í `NEXT_PUBLIC_*`.

Gamlar Supabase-migrations eru varðveittar í `supabase/migrations/` sem saga, ekki keyrðar á Neon. Flutningur tenginga flytur **ekki** sjálfkrafa eldri notendur eða heilsugögn. Ef Supabase var þegar í notkun þarf sérstakt afrit, sannreynda vörpun notendaauðkenna og samanburð á öllum færslum áður en skipt er yfir. Ekki eyða gamla gagnagrunninum við þennan flutning.

## 3. Google-innskráning

1. Neon Auth → OAuth providers → Google. Sameiginlegir Google-lyklar Neons henta prófunum; stilltu eigin Google OAuth-forrit fyrir útgáfu með appheiti og persónuverndarslóð.
2. Notaðu callback-slóðina sem Neon Console sýnir fyrir Google. Google Client Secret er geymdur hjá Neon, ekki í Next.js eða GitHub.
3. Bættu nákvæmum uppruna appsins, t.d. `https://þitt-app.vercel.app`, við **Trusted domains** á réttri Neon-grein. `NEXT_PUBLIC_APP_URL` verður að vera sami uppruni. Ekki opna víð wildcard fyrir framleiðslu.
4. Innskráning byrjar á `/auth/login`. Neon sér um Google OAuth og `/app` proxy skiptir OAuth-tákni fyrir session-cookie. API sækir ferska session með `disableCookieCache: 'true'` áður en gögn eru opnuð; útrunnin eða afturkölluð session er ekki samþykkt.
5. Prófaðu nýjan notanda, endurinnskráningu, neitað Google-samþykki, afturköllun session og útskráningu í raunverulegum vafra.
6. Prófaðu reikningseyðingu með eigin prófunarreikningi. Hún notar Neon Auth `deleteUser`; eyðing auth-notandans eyðir tengdum appgögnum með FK cascade. Ef Neon krefst ferskrar innskráningar eða viðbótarstaðfestingar sýnir appið villu og fullyrðir ekki að eyðingu sé lokið.

Opinberar leiðbeiningar: [Neon Auth fyrir Next.js](https://neon.com/docs/auth/quick-start/nextjs), [Neon Auth server SDK](https://neon.com/docs/auth/reference/nextjs/server).

## 4. Vercel

Repo `aron5109/gedheilsa`, Next.js preset, Node 24, build `npm run build`. Þetta er ekki static-export verkefni. Neon Marketplace tengingin útvegar gagnagrunnsbreytur, en athuga þarf Auth URL, cookie secret og app-slóð sérstaklega.

`vercel.json` festir Next.js preset, byggingarskipun og `.next` úttak í kóðanum svo eldri stillingar verkefnisins ráði ekki þessum gildum. **Root Directory** í Vercel á að vera rót repósins (sjálfgefið tómt), þar sem `package.json` er staðsett.

### Ef bygging tekst en síðan sýnir `404 NOT_FOUND`

Ef verkefnið var tengt áður en Next.js-kóðinn kom inn gæti Vercel enn verið stillt á **Other**. Þá getur `npm run build` tekist en Vercel birt aðeins skrár úr `public`, án síðna og API-aðgerða appsins. Vantar bæði `Detected Next.js version` og upplýsingar um pökkun serverless functions í heildarannálinn er það vísbending um slíka stillingu, ekki full staðfesting.

1. Útgefðu nýjasta commit sem inniheldur `vercel.json`. Endurútgáfa gamals commits tekur ekki nýju skrána með.
2. Í **Settings → Build and Deployment** skaltu staðfesta **Next.js**, `npm run build`, `.next` og rót repósins. Skráin í repóinu yfirskrifar fyrstu þrjú gildin við næstu útgáfu.
3. Opnaðu **Visit** á nýju útgáfunni og prófaðu `/` og `/demo`. Skoðaðu **Build Output** og staðfestu að bæði síður og serverless functions séu til staðar.
4. Ef nýja útgáfuslóðin virkar en aðallénið ekki skaltu skoða **Settings → Domains** og hvort útgáfan sé merkt **Production / Current**. Ef hvorug virkar skaltu skoða nákvæma slóð, útgáfuaðgang og runtime logs.

Óstillt Neon-innskráning á ekki að valda Vercel-404 á forsíðunni: `/` og `/demo` eiga að birtast þótt þjónustulykla vanti. Viðvaranir frá npm um peer dependencies eða deprecated pakka eru heldur ekki einar og sér skýring þegar annállinn endar á `Deployment completed`.

Heimildir: [byggingarstillingar Vercel](https://vercel.com/docs/builds/configure-a-build) og [404 eftir vel heppnaða útgáfu](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404).

Nauðsynlegar breytur fyrir innskráningu: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_APP_URL`. Migration þarf einnig `DATABASE_URL_UNPOOLED`. Stilltu hverja breytu fyrir rétt umhverfi og endurútgefðu eftir breytingar. Preview á að nota sérstaka Neon-grein og samsvarandi Auth URL.

GitHub-tengingin getur útgefið kóðann sjálfkrafa, en útgáfa ein og sér staðfestir ekki gagnagrunn, Google-innskráningu eða tilkynningar. Óstillt innskráning birtir uppsetningarskilaboð og `/demo` helst aðgengilegt.

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

Notandi virkjar tilkynningar sérstaklega í **Mitt rými**. Þar má einnig velja persónulegar kveðjur með fornafni og skoða dæmi áður en tilkynningar eru virkjaðar. Þessi kostur er sjálfgefið óvirkur; breyting tekur gildi við næstu sendingu. Tilkynning opnar viðeigandi skráningu eða áminningar. Á iPhone er Home Screen uppsetning forsenda Web Push á studdum útgáfum. Vafrakerfi geta hindrað eða tafið tilkynningar. Prófaðu raunveruleg tæki og leyfisstillingar.

## 7. Dagatöl og næstu tengingar

`.ics` skrá virkar til innflutnings í Apple Calendar/iCal og önnur studd dagatöl. Google-hlekkurinn opnar viðburð sem notandinn staðfestir í Google Calendar; það er dagatalið sem Android-notandinn samstillir við símann sinn. Þetta er ekki hljóðlaus bein skrifaðgerð á tækið.

Heiti er sjálfgefið „Frátekinn tími“. Heiti/staðsetning fylgja aðeins ef notandi velur það. Skráin inniheldur einka-merkingu og áminningu, en dagatalsforritið ræður hvort það tekur við áminningunni. Eyðing í Hlýju eyðir ekki þegar innfluttum viðburði. Ekki er sífelld tvíhliða dagatalssamstilling í þessari útgáfu.

## 8. Áður en raunveruleg notkun hefst

Fylgdu [rekstrar- og útgáfugátlista](REKSTUR.md). Náðu fyrst góðum árangri með tilbúnum gögnum, síðan með afmörkuðum, upplýstum prófunarhópi eftir viðeigandi yfirferð.
