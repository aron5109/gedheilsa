# Hlýja — leiðbeiningar fyrir þróun

- Allt sýnilegt viðmót, villur, tölvupóstar og aðgengisheiti skulu vera á íslensku.
- Varðveittu rólegan tón. Ekki nota sektarkennd, tapsækin stigasöfnun eða refsingu fyrir skráningarleysi.
- Ekki túlka fjarveru gagna sem vanlíðan eða bæta við greiningum/sjálfsvígsspám.
- Aðstandendatilkynningar þurfa sérstakt afturkallanlegt samþykki, staðfest netfang og takmarkað innihald.
- Ekki birta raunveruleg heilsugögn, lykla eða notendaskjáskot á GitHub eða í annálum.
- Server routes sannreyna notanda með `getUser`; RLS er önnur varnarlína. Service role er eingöngu á vefþjóni.
- Ný mæligögn eru sjálfstæðar UUID-færslur, ekki ein uppfærð lína á dag. Biðfærslum má aðeins eyða eftir staðfesta samsvarandi móttöku.
- Breytt gagnalíkan fer í nýja SQL-migration þegar upphafsskjalið hefur verið tekið í notkun.
- Prófa sérstaklega aðskilnað notenda, endursendingu, tímabelti, samþykki og útflutning þegar slík virkni breytist.
- Keyrðu `npm run check`, `npm run format:check` og viðeigandi `npm run test:e2e` fyrir afhendingu.
- `docs/UPPSETNING.md` lýsir þeim þjónustum sem þurfa eigin lykla. Ekki láta óstillta þjónustu líta út fyrir að vera virk.
