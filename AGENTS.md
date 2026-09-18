# Hlýja — leiðbeiningar fyrir þróun

- Allt sýnilegt viðmót, villur, tölvupóstar og aðgengisheiti skulu vera á íslensku.
- Varðveittu rólegan tón. Ekki nota sektarkennd, tapsækin stigasöfnun eða refsingu fyrir skráningarleysi.
- Ekki túlka fjarveru gagna sem vanlíðan eða bæta við greiningum/sjálfsvígsspám.
- Aðstandendatilkynningar þurfa sérstakt afturkallanlegt samþykki, staðfest netfang og takmarkað innihald.
- Ekki birta raunveruleg heilsugögn, lykla eða notendaskjáskot á GitHub eða í annálum.
- Server routes sannreyna ferska Neon Auth-session með `currentUser()`; RLS er önnur varnarlína. Hver gagnabeiðni notar transaction-local `hlyja_user` og staðfest eigandaauðkenni. `hlyja_worker` er aðeins notaður á vefþjóni fyrir afmarkaðar þjónustuaðgerðir.
- Ný mæligögn eru sjálfstæðar UUID-færslur, ekki ein uppfærð lína á dag. Biðfærslum má aðeins eyða eftir staðfesta samsvarandi móttöku.
- Breytt gagnalíkan fer í nýja SQL-migration þegar upphafsskjalið hefur verið tekið í notkun.
- Prófa sérstaklega aðskilnað notenda, endursendingu, tímabelti, samþykki og útflutning þegar slík virkni breytist.
- Keyrðu `npm run check`, `npm run format:check` og viðeigandi `npm run test:e2e` fyrir afhendingu.
- `docs/UPPSETNING.md` lýsir þeim þjónustum sem þurfa eigin lykla. Ekki láta óstillta þjónustu líta út fyrir að vera virk.

## UI og UX

- Fyrir breytingar á viðmóti: lestu `PRODUCT.md`, `DESIGN.md` og viðeigandi leiðbeiningar í `.agents/skills/impeccable/SKILL.md` og `reference/`. `docs/IMPECCABLE.md` skráir útgáfu og stöðu greinisins.
- Skapskráning er forgangsverkefni, með stóru vali í síma. Varðveittu græna, rólega auðkennið og íslenska röddina við lagfæringar.
- Notaðu `polish` fyrir afmarkaðar lagfæringar, `audit` fyrir mælanlega yfirferð og `harden` fyrir jaðartilvik. Þessar leiðbeiningar veita ekki sjálfkrafa heimild til að senda gögn, samþykkja hooks eða skipta út auðkenni.
- Óvistaður texti má ekki hverfa við Escape eða lokun án skýrs vals. Staðfestu Back/Forward, áherslu og stækkaðan texta þegar flæði breytist.
- Ekki kalla Impeccable-greini staðist nema hann hafi raunverulega keyrt. Handvirk yfirferð, axe og Playwright eru aðskildar sannanir.
