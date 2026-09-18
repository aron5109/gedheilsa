# Hlýja — samhengi vörunnar

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Íslenskumælandi fólk sem vill skrá eigin líðan og sjá breytingar yfir tíma. Síminn er mikilvægasti notkunarstaðurinn samkvæmt verkefnislýsingu. Núverandi upphafsflæði takmarkar prufuútgáfuna við 18 ára og eldri; notkun barna hefur ekki verið útfærð.

## Product Purpose

Auðvelda margar skapskráningar á dag, persónulegar hugmyndir út frá áhugamálum og mildar áminningar. Líðan er aðalatriðið. Vatn, svefn og hreyfing styðja við daglegt yfirlit.

## Operating Context

Notandi getur haft litla orku eða verið truflaður í miðri skráningu. Ekki bæta við óþarfa ákvörðunum, sektarkennd, skráningarkeppni eða kröfu um jákvæðni. Textar og aðgengisheiti eru á íslensku. Browser Back/Forward á að virka milli aðalskjáa.

## Capabilities and Constraints

Next.js, React og Neon. Google OAuth, persónulegar Web Push-áminningar, samþykkt stuðningsboð, CSV/JSON og dagatalsútflutningur eru í kóðanum. Þjónustulykla og rekstraruppsetningu vantar fyrir raunverulega notkun. Apple/Samsung-skrefatengingar eru framtíðarverkefni. `/demo` notar tilbúin gögn og varðveitir ekki breytingar við endurhleðslu.

Óvistaður texti á að vera varinn við lokun glugga; hann er ekki sjálfkrafa geymdur á tækinu. Skráðar færslur nota UUID og staðfesta móttöku. Samþykki þarf fyrir biðgeymslu og deilingu. Hlýja er ekki sjúkdómsgreining, sjálfsvígsspá eða neyðareftirlit.

## Brand Commitments

Hlýja er núverandi vinnuheiti. Notandi óskar eftir minimalísku, hlýju og umhyggjusömu viðmóti og hefur vísað til Samsung Health fyrir skapskráningu og yfirlit. Nafnið hefur ekki verið vörumerkjakannað. Varðveita núverandi hlýjan litablæ og íslensku röddina við endurbætur.

## Evidence on Hand

Verkefnislýsing og Samsung Health-viðmið frá notanda, útfært sýnishorn, sjálfvirk próf og skjáskot í `docs/images/`. Engin raunveruleg heilsugögn eða notendarannsókn fylgir. Daglegir fróðleiksmolar hafa heimildir í `src/lib/domain/daily-content.ts`.

## Product Principles

- Skráning líðanar á að vera auðveldasta aðgerðin.
- Notandinn ræður hraðanum, textanum og deilingunni.
- Sýna rétt stöðu vistunar og stillinga.
- Skráningar og óvistaður texti mega ekki hverfa við venjulegar aðgerðir án skýringa.
- Allur fróðleikur er varfærinn, aðgreindur frá hvatningu og heimildastuddur.

## Accessibility & Inclusion

Stórir snertifletir, texti með litum og svipbrigðum, sýnileg lyklaborðsáhersla, skýr heiti og stuðningur við stækkaðan texta og minnkaða hreyfingu. Viðeigandi leiðbeiningar Apple, Google og WCAG eru viðmið, ekki vottun. Rauntæki og skjálesarar þurfa sérstaka yfirferð.
