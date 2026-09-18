# Impeccable í Hlýju

Impeccable 4.3.1 er sett upp fyrir verkefnið í `.agents/skills/impeccable`, óbreytt úr [pbakaus/impeccable](https://github.com/pbakaus/impeccable/tree/f2c7051853848826aac2f4646581d62a732155ad) við commit `f2c7051853848826aac2f4646581d62a732155ad`. Upprunaleg LICENSE og NOTICE fylgja. Pakkinn er þróunartól; hann er ekki hluti af notendaviðmóti, vinnur ekki með notendagögn og er ekki innfluttur í appið.

## Varanlegt samhengi

- `PRODUCT.md` geymir staðfest verkefnissamhengi og mörk.
- `DESIGN.md` geymir hönnunarviðmið, liti, letur og endurtekin mynstur.
- `AGENTS.md` tengir þessi skjöl við næstu viðmótsbreytingar.
- Halda útgáfu Impeccable fastri. Yfirfara breytingar áður en hún er uppfærð.

## Notkun

Í Codex sem les verkefnisbundin skills verður `$impeccable` tiltækt eftir endurhleðslu/næstu lotu. Dæmi: `$impeccable polish src/components/entry-forms.tsx` eða `$impeccable audit src/components`. Venjuleg beiðni um viðmótslagfæringu getur líka notað leiðbeiningarnar.

Sjálfvirkur greinir krefst Impeccable engine sem launcher sækir og sannreynir með SHA-256. Í þessari vinnulotu rann `context` út á tíma eftir 35 sekúndur og `detect` eftir 15 sekúndur án niðurstöðu. Því er **ekki** fullyrt að sjálfvirkur Impeccable-greinir hafi staðist. Leiðbeiningarnar voru lesnar og notaðar beint. Engin hook-trust stilling var sjálfvirkt samþykkt. Ekki sleppa öryggisathugunum launchers til að ræsa hann.

## Yfirferð 18. september 2026

Notaðar voru leiðbeiningar `polish`, `operate`, `harden`, `audit` og `craft-floor`. Þetta var ein samþætt yfirferð og útfærsla; ekki formlegt tveggja rýnenda `critique`-ferli og ekki aðgengisvottun.

| Forgangur | Staðfest atriði                                                                             | Breyting                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P1        | Valinn aðalskjár var aðeins í React-state; Back/Forward og endurhleðsla fylgdu ekki valinu. | Leyfð skjáheiti í URL-broti, vafrasaga, síðuheiti og áhersla á aðalefni.                                                     |
| P1        | Escape eða lokunarhnappur gat hent texta úr skráningu.                                      | Staðfest lokun, örugga valið fær áherslu, texti helst við áframhald; viðvörun vafra við endurhleðslu þegar hann styður hana. |
| P2        | Eftir val á líðan þurfti að skanna sömu fimm val aftur ásamt öllum aukareitum.              | Valin líðan í samantekt, auðvelt að breyta; aukareitir opnast eftir þörfum.                                                  |
| P2        | Dagleg skráning vatns/svefns/hreyfingar kom á eftir löngu efni í síma.                      | Færð strax á eftir skapsvali.                                                                                                |
| P2        | Skrautlína leit út eins og svefnmæling, þótt hún væri föst.                                 | Fjarlægð.                                                                                                                    |
| P3        | Endurteknir formálar, skraut og jafnstór hugmyndaspjöld jöfnuðu vægi efnis.                 | Skýrari fyrirsagnir, styttri efnisröð og einfaldar hugmyndaraðir.                                                            |

Lokaprófin fundu einnig of lítinn litamun í stuðningstexta, titil sem var yfirskrifaður við endurhleðslu og tímamerkingu utan hugmyndaraðar. Þetta var leiðrétt. Ef tími skráningar er ógildur opnast aukareitirnir aftur svo hægt sé að leiðrétta hann.

Varðveitt: íslenska röddin, fimm skapsstig, consent/RLS, UUID-færslur, sendingarbiðröð og daglegur textabanki. Stækkað skapsval var þegar í góðu horfi og er áfram aðalaðgerðin.

## Próf og mörk

Keyra `npm run check`, `npm run format:check` og `npm run test:e2e`. Vafrapróf ná meðal annars yfir vistun, óvistaðan texta, bakflettingu, endurhleðslu, 320–430px skjái, 200% texta, axe og skjáheiti. Bera saman skjáskot tölvu og síma í einni yfirferð.

Staðfest í vinnuumhverfi: lint, TypeScript, 43 einingapróf, framleiðslubygging, sniðathugun og 14 Chromium-vafrapróf stóðust. GitHub CI keyrir vafraprófin bæði í Chromium og WebKit. Skjáskot nota eingöngu tilbúin sýnishornsgögn:

- [Tölvuútlit](images/hlyja-desktop.png)
- [Símaútlit](images/hlyja-mobile.png)
- [Skráning líðanar](images/hlyja-entry.png)
- [Vörn fyrir óvistaðan texta](images/hlyja-draft.png)

Raunveruleg iOS/Android-tæki, VoiceOver/TalkBack, kerfislyklaborð og framleiðslusendingar eru enn utan sjálfvirku prófanna. Engin staðfest Core Web Vitals-mæling eða full dökk þemaútfærsla er til. Viðvörun við endurhleðslu er háð vafra; þetta er ekki sjálfvirk vistun draga og kemur ekki í veg fyrir tap við lokun stýrikerfis á vafranum.
