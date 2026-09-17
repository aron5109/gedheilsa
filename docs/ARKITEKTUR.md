# Arkitektúr og ákvarðanir

## Heildarmynd

Next.js sér um íslenskt viðmót og API. Google-innskráning fer um Supabase Auth með PKCE og server-cookie. API sannreynir notandann með `getUser()` og notar Supabase með réttindum þess notanda fyrir almenn gögn. PostgreSQL RLS einangrar gögn eftir `auth.uid()`; eigandaauðkenni kemur frá staðfestri innskráningu, ekki beiðninni.

Service role er aðeins notað fyrir afmarkaðar aðgerðir sem notandinn á ekki sjálfur að geta falsað: netfangsstaðfestingu, job-biðröð, sendingarmörk og lokun reiknings. Það er ekki flutt inn í client components.

## Mælingar og varðveisla

- `mood_entries` og `wellbeing_entries` eru sjálfstæðar, óbreytanlegar mælingar. Fleiri en ein færsla á dag er sjálfgefin hegðun.
- Client býr til UUID áður en vistun hefst. Sama færsluauðkenni er endurnotað við endursendingu.
- API staðfestir að fyrirliggjandi færsla með sama UUID hafi nákvæmlega sama innihald. Árekstur með öðru innihaldi er villa, ekki þögul yfirskrift.
- Biðgeymsla er valkvæð IndexedDB-geymsla eftir notanda. Transaction þarf að ljúka áður en appið segir færsluna móttekna í bið.
- Ósendar færslur eyðast fyrst eftir samsvarandi staðfesta móttöku á vefþjóni. Engin sjálfvirk hreinsun á útrunnum biðfærslum er til staðar.
- Staðfest gögn eru á vefþjóni. Þau eru ekki öll afrituð í localStorage. Sýnishorn er tímabundið minni með tilbúnum gögnum.
- Samstilling fer fram í opnum flipa og við endurkomu netsambands. Full offline-upphafssíða og Background Sync eru ekki innifalin. Ekki hægt að endurhlaða persónulega síðu án nets og treysta á cache.
- UTC-tímastimplar eru varðveittir. Dagaskipting, áminningar og stuðningsregla fylgja IANA-tímabelti prófíls. Tímabelti er sannprófað í API og gagnagrunni.

## Stuðningsregla

Val notandans er 3–14 samliggjandi almanaksdagar. Hver dagur þarf raunverulegar skráningar með meðaltali ≤2 á 1–5 kvarða. Nýjasta færsla þarf einnig að vera ≤2 og innan 24 tíma. Dagar án skráninga brjóta rununa. Engin afleiðsla er gerð frá skrefum, lyfjum eða skráningarleysi.

Reglan er **ekki klínískt staðfest og er ekki mat á hættu**. Hún er gagnsæ, stillanleg beiðni um félagslegan stuðning. Fyrir notkun með raunverulegum notendum þarf faglega og notendamiðaða yfirferð.

Aðstandandi fær bara nafn notandans og beiðni um samband. Notandi þarf að virkja og samþykkja, viðtakandi þarf að staðfesta netfang, tilkynningar eru takmarkaðar við eina á sjö dögum til hvers viðtakanda, og afskráning er í skilaboðunum. Skilyrði og samþykki eru sannreynd aftur áður en send er beiðni úr biðröð.

## Áminningar

`profiles.personal_notifications` er sjálfgefið `false`. Við sendingu er núverandi val lesið og kveðja mynduð með fornafni ef notandi hefur virkjað hana. Hvorki skráð líðan, dagbókartexti né lyfjaheiti fara í Web Push. Service worker birtir textann úr sendingunni og leyfir aðeins fyrirfram ákveðnar `/app`-slóðir. Hann endurhleður ekki annan opinn glugga með ókláruðu eyðublaði.

Scheduler gengur yfir raunverulegar mínútur í síðasta tíu mínútna glugga og ber saman staðartíma. Þannig er ekki gert ráð fyrir að allir almanaksdagar séu nákvæmlega 24 tímar. Tvítekin klukkustund við vetrartíma fær sama occurrence-auðkenni og er ekki send tvisvar.

- Daglegar áminningar: routine ID + staðbundin dagsetning + HH:mm.
- Staðfesting á lyfjatöku: einn óbreytanlegur atburður fyrir hverja áætlaða stund; tvísmellur býr ekki til tvær staðfestingar.
- Framtíðarskammtar eru ekki staðfestanlegir í API eða UI.
- Læknistímar: UUID, UTC, lengd og fyrirvari. Endursending notar sama job.
- Jobs hafa claim-lock, takmarkaðan fjölda tilrauna og gildistíma. Tölvupóstur notar idempotency key hjá Resend. Web Push er best-effort með sama tag-i til að sameina tvítekningar á tæki.

Ekki er hægt að lofa afhendingu eða nákvæmum tíma. „Sent“ í stöðu þýðir samþykkt af þjónustuveitu, ekki að manneskja hafi séð eða lesið skilaboðin.

## Útflutningur og samhæfni

CSV: UTF-8 BOM, semíkomma, CRLF, allar valdar færslur, tímastimplar og vörn gegn töflureikniformúlum. Dagbókartexti er sjálfgefið undanskilinn. Allar síður gagnasafns eru sóttar svo 1.000 raða sjálfgefið hámark Supabase klippi ekki af sögu.

JSON: `schema_version`, útflutningstími, prófíll, mælingar, áminningar, staðfestingar, tímar, stuðningsaðilar og sýnileg job-staða. UI bætir ósendum biðfærslum við sem `pending_entries`. Þetta er gagnasafn til varðveislu/afhendingar, ekki enn almenn innflutningsaðgerð.

iCalendar: stöðugt UID, UTC, línubrotsvörn, UTF-8 línafelling, `CLASS:PRIVATE` og `VALARM`. Engin OAuth-dagatalsscope er nauðsynleg. Google-hlekkur opnar viðburð til staðfestingar. Afrit utan Hlýju samstillast ekki sjálfkrafa.

## Afmörkun fyrstu útgáfu

Engin LLM vinnsla, engin sjúkdómsgreining, engar skammtaráðleggingar, engin samþykkt frá aðstandanda án athafnar hans, enginn skrefainnflutningur úr heilsukerfum enn. Hugbúnaðurinn er ætlaður fullorðnum í þessari útgáfu. Engin ábyrgð á 24/7 vöktun er gefin.

## Daglegt efni

31 frumsaminn íslenskur texti og 12 heimildastuddir fróðleiksmolar eru í `src/lib/domain/daily-content.ts`. Valið byggir á almanaksdegi í tímabelti notandans, er stöðugt við endurhleðslu og endurnýjast við dagaskipti eða þegar komið er aftur í appið. Engin skráð líðan fer til ytri efnisþjónustu. Sjá [málfar og aðgengi](MALFAR-OG-ADGENGI.md).
