# Rekstur, gagnavarðveisla og útgáfa

## Fyrir raunveruleg heilsugögn

Þessi atriði þurfa að vera staðfest af ábyrgðaraðila áður en appið er opnað almenningi. Kóði í repository staðfestir ekki að þau séu framkvæmd.

- [ ] Ábyrgðaraðili, tengiliður, tilgangur og notendahópur hafa verið skilgreind.
- [ ] Persónuverndarstefna, upplýst samþykki, varðveislutími og eyðingarferli hafa verið fullgerð fyrir raunverulegan rekstur. Yfirlitssíðan `/personuvernd` er ekki fullbúinn lagatexti.
- [ ] Viðeigandi fagfólk hefur metið notendatexta, stuðningsreglu, lyfjaáminningar og hvort fyrirhugaður tilgangur kalli á viðbótarkröfur.
- [ ] Vinnslusamningar og staðsetning gagna hjá hýsingu, gagnagrunni og tölvupóstþjónustu hafa verið yfirfarin.
- [ ] Aðgangur stjórnenda er takmarkaður, MFA virkt og framleiðslu-/prófunarumhverfi aðskilin.
- [ ] RLS, session-útrennsli, útskráning, lykilskipti og eyðing reiknings hafa verið prófuð á stilltri Neon-grein.
- [ ] Cron keyrir á fimm mínútna fresti; varnarlykill er sannreyndur og biðraðarvöktun virk.
- [ ] Raunveruleg Google-, netfangsstaðfestingar-, afturköllunar- og Web Push-flæði hafa verið prófuð á Android, iPhone og tölvu með tilbúnum gögnum.
- [ ] Aðgengisprófun með lyklaborði, VoiceOver/TalkBack og stærra letri hefur verið framkvæmd auk sjálfvirkra axe-prófa.
- [ ] Ekki eru opin villuspor, query tokenar, mail-body eða health payload í aðgangslogum eða villuvöktun.
- [ ] Öryggisafrit og endurheimt hafa verið prófuð, sjá næsta hluta.

## Afrit og endurheimt

1. Veldu og virkjaðu viðeigandi Neon-afrit/PITR-áætlun. Staðfestu hvað þjónustuáskriftin nær raunverulega yfir; kóðinn kveikir ekki á greiddri afritunarþjónustu.
2. Skilgreindu RPO og RTO með ábyrgðaraðila. Skráðu þau, t.d. hversu langt aftur má tapa óafrituðum breytingum og hve hratt þarf að endurheimta.
3. Geymdu viðbótarafrit aðeins í samþykktri dulkóðaðri geymslu með takmörkuðum aðgangi. Aldrei GitHub, opinn object bucket eða tölvupóstur.
4. Endurheimtu reglulega í aðskilið, læst umhverfi og sannprófaðu notendafjölda, færslufjölda, tímasetningar og RLS. Notaðu gagnaskrá án heilsuinnihalds til að skrá niðurstöðu prófs.
5. **Stöðvaðu cron og allar útleiðandi sendingar fyrir endurheimt.** Annars gætu gömul jobs eða áður afturkölluð samþykki vaknað aftur. Farðu yfir sendingarferil, eyðingarbeiðnir og afturköllun áður en sendingar hefjast.
6. Tryggðu að afrit falli úr varðveislu samkvæmt samþykktri stefnu og að eyðingarbeiðnir séu virtar við endurheimt.

## Bilun á neti / tæki

Biðgeymsla bætir varðveislu við skammvinnt netsambandsrof í opnum flipa. Hún er ekki tryggt afrit. Vafri getur fjarlægt gögn, private browsing getur haft önnur geymsluskilyrði og týnt tæki getur þýtt glataðar ósendar færslur. Appið merkir bið og lætur vita þegar ekki tekst að vista.

Ef biðfærsla kemst ekki áfram: ekki hreinsa vafragögn. Sæktu **Öll gögn (JSON)** áður en tæki er lagfært eða vafrasnið endurstillt. Þar eru `pending_entries` sérmerkt. Endurheimt þeirra í þessa fyrstu útgáfu er handvirkt, stýrt ferli með varðveislu UUID, ekki almennt UI-innflutningsflæði.

## Eftirlit

Fylgstu með síðustu vel heppnuðu cron-keyrslu, fjölda `pending/failed` jobs, elstu óloknu sendingu, gagnagrunnstengingum og aðgangsvillum. Mæligildi skulu vera talningar/tímar, ekki notandanöfn eða heilsugögn.

`/api/cron` skilar aðeins talningum. Takmarkað batch er 50 jobs í keyrslu. Stækka þarf vinnslu og paging við meiri notkun; þetta er grunnur fyrir litla fyrstu útgáfu, ekki staðfest álagsþol fyrir stóra notendahópa. Stilltu vekjaraklukku fyrir cron-bilun í rekstrarvöktun, ekki stuðningsaðstandendur.

Tölvupóstsending hefur provider-idempotency. `sent` merkir að veitandi tók við, en bounce/delivery webhooks og staðfesting á lestri eru ekki innifalin. Aðstandendaflæði þarf að sýna þessum takmörkunum virðingu.

## Útgáfuferli

1. Grein og yfirferð á breytingum, keyra CI.
2. Migration prófað í aðskildu umhverfi. Aldrei endurskrifa migration sem þegar hefur verið keyrt í rekstri.
3. Prófa OAuth og aðskilnað tveggja notenda, vista/reload, netsambandsrof, cron og afturköllun með tilbúnum gögnum.
4. Afrit + afturköllunaráætlun áður en útgáfa fer í notkun.
5. Opna takmarkaðan prófunarhóp fyrst. Skráðu villur án persónu- eða heilsugagna.
