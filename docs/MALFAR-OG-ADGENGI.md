# Málfar, daglegt efni og aðgengi

## Rödd Hlýju

Stutt, eðlileg íslenska með hlýju. Opnar spurningar, án þess að gera ráð fyrir hvernig notanda líður. „Hvernig líður þér í dag?“ á betur við en „Ertu ekki góður í dag?“ Engin sektarkennd vegna skráningarleysis, loforð um bata eða krafa um jákvæðni. Notum „staldraðu“, „á mannamáli“ og „nýjasta svefnskráning“. Forðumst skástrik fyrir kyn þegar hægt er að orða texta eðlilega fyrir öll kyn.

Orð dagsins eru frumsamdir textar frá Hlýju, ekki tilvitnanir eignaðar þekktu fólki. Bankinn hefur 31 texta og endurtekur ekki texta innan 31 dags. Fróðleikur er aðskilinn frá hvatningu, merktur „Gott að vita“ og hefur sýnilegan heimildahlekk merktan „á ensku“. Þar eru 12 textar í daglegri röð. Engin fullyrðing um að vatn, svefn eða hreyfing leysi vanlíðan ein og sér.

Dagurinn miðast við tímabelti prófílsins. Sömu skilaboð haldast við endurhleðslu og breytast við nýjan dag, líka yfir mánaðamót, áramót og breytingar á sumartíma. Opin síða athugar daginn á 30 sekúndna fresti og þegar notandi kemur aftur í hana.

## Heimildir fyrir fróðleik

Yfirfarið 17. september 2026. Textar í bankanum eru stuttar íslenskar endursagnir. Tillagan á eftir hverri staðreynd er almenn, valkvæð hugmynd frá Hlýju.

- Vatn: [CDC — About Water and Healthier Drinks](https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html). Hlutverk vatns, ólík vökvaþörf og vökvi úr mat/drykkjum. Enginn sameiginlegur lítrafjöldi fyrir alla.
- Svefn og líðan: [NHLBI — How Sleep Affects Your Health](https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects). Svefn, athygli, minni og tilfinningar.
- Svefnvenjur: [NHLBI — Healthy Sleep Habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits). Reglulegur taktur, ró fyrir svefn og svefnumhverfi.
- Hreyfing: [WHO — Physical activity](https://www.who.int/news-room/fact-sheets/detail/physical-activity). Mismunandi hreyfing í daglegu lífi og tengsl við andlega líðan og svefn.

Við nýtt efni: lesið frumheimild, sannreynið nákvæma fullyrðingu, bætið við heimild og dagsetningu yfirferðar. Farið yfir íslensku í samhengi við skjáinn. Ekki bæta við ósannreyndum höfundatilvitnunum eða læknisráðleggingum.

## Síma- og aðgengisviðmið

Þetta er vefforrit. Viðmiðin hér eru viðeigandi hlutar opinberra leiðbeininga Apple, Google og W3C, ekki vottun frá fyrirtækjunum eða staðfesting á að öllum skilyrðum App Store/Google Play sé fullnægt.

| Viðmið            | Útfærsla                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stór snertiflötur | Hnappar að lágmarki 48 × 48 CSS px. Skapsval í síma er heilar raðir, a.m.k. 64 px háar. CSS px eru vefeiningar, ekki bein mæling á native pt/dp. |
| Skýr forgangsröð  | Skapsval er fyrsta aðgerð forsíðunnar; öll fimm val fá texta og svipbrigði.                                                                      |
| Læsileiki         | Kerfisletur, hlutfallslegar `rem`-stærðir, 16 px innsláttur og engin hömlun á aðdrætti.                                                          |
| Litir og staða    | Texti og form fylgja litum. Valin líðan hefur ramma og `aria-pressed`. Sjálfvirk litaskilapróf með axe.                                          |
| Lyklaborð         | Sýnileg áhersla, stökkslóð, innbyggður dialog, Escape og endurheimt áherslu við lokun. Áhersla færist í aðalefni við valmyndarskipti.            |
| Skjár og snerting | Prófað við 320, 390 og 430 CSS px, 200% textastærð, safe-area innfellingar, aðgerðir með snertingu án sveipkröfu.                                |
| Hreyfing          | `prefers-reduced-motion` stöðvar skrautlegar hreyfingar.                                                                                         |
| Tilkynningar      | Leyfi með notandaaðgerð, valkvæð nafnbirting með forskoðun og afturköllun. Engin skráð líðan eða lyfjaheiti á læsiskjá.                          |

Heimildir: [Apple — UI Design Dos and Don’ts](https://developer.apple.com/design/tips/) (44 pt snertifletir, læsileiki og skjáaðlögun), [Google — Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps) (48 dp, litaskil og merkingar), [W3C — WCAG 2.2 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Vafrapróf keyra í Chromium og WebKit (Safari-vélinni). Sjálfvirk próf staðfesta afmörkuð viðmið. Fyrir opinbera útgáfu þarf líka handvirka yfirferð á raunverulegum iPhone og Android-símum, VoiceOver/TalkBack, skjályklaborði, stærri texta og tilkynningaleyfum. Web Push-sendingar þarf að prófa með stilltum þjónustum. Ekki lýsa kerfinu sem vottuðu eða fullyrða að öll aðgengisviðmið séu uppfyllt á grundvelli sjálfvirkra prófa eingöngu.
