# Vegvísir

## Næst: tengja fyrstu útgáfu

- Stilla Neon, Google OAuth, hýsingu, Resend, VAPID og cron samkvæmt uppsetningarleiðbeiningum.
- Yfirfara ábyrgð, samþykki, aðgengi, varðveislu og stuðningsreglu áður en raunverulegur prófunarhópur byrjar.
- Prófa raunveruleg tæki, afhendingu tölvupósts og leyfisflæði á iOS/Android.

## Betri gagnavinna

- Síðuð saga með leit og afmörkuðum server-útreikningum þegar notendur hafa mjög mikla sögu.
- Stýrður JSON-innflutningur með schema-version, endurtekningavörn og forskoðun. Aldrei þögul yfirskrift.
- Leiðrétting færslu með varðveittum breytingaferli, ef notandi hefur skráð rangt.
- Sveigjanlegri áminningar eftir vikudögum, hlé og birgðayfirlit án skammtaráðgjafar.
- Örugg deilingargátt með tímabundnum aðgangi fyrir viðtakanda sem valkostur við tölvupóstviðhengi.
- Betri uppsetningarathugun á cron og útleiðandi þjónustum; sýna rekstrarstöðu án þess að afhjúpa lykla.

## Skref frá Samsung og Apple

Vafraforritið hefur ekki sjálft aðgang að HealthKit/Health Connect. Næsta skref er sér heimildaflæði í native-símaforriti eða native-hluta umhverfis vefviðmótið.

### Android / Samsung

Nota [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect) og staðfestar heimildir fyrir `StepsRecord`. Samsung Health getur verið gagnauppspretta í Health Connect. Lesa aggregate skref fyrir tímabil með tilliti til forganga uppspretta svo sími + úr tvítelji ekki sömu skref.

### Apple

Nota [HealthKit](https://developer.apple.com/documentation/healthkit) úr native iOS-hluta með sérstökum heimildum. Ekki nota Google OAuth sem staðgengil heilsugagnaheimilda. Testa afneitað samþykki, breyttar heimildir og eyðingu gagna hjá uppsprettu.

### Innflutningssamningur

`wellbeing_entries` geymir `source` og `external_id`, með einstökum `(user_id, source, external_id)`. Núverandi opin API-leið tekur **aðeins** við handvirkum færslum; framtíðarsync þarf sjálfstæða sannreynda leið.

Hönnun framtíðarsync verður að skilgreina:

- notandaauðkenni og afmarkað scopes/samþykki;
- dag-/tímabilsgrennd, tímabelti og sameiningu uppspretta;
- idempotency, sync-cursor og afturköllun heimilda;
- uppfærslu og eyðingu mælinga hjá uppruna án þess að bæta þeim við sem nýjum skrefum;
- aðskilnað handvirkra skrefa og innflutts heildarsummu;
- prófun á ferðalögum yfir tímabelti og við sumartímaskipti.

Sýna „Tengt“ aðeins þegar raunveruleg heimild og gagnasending hefur tekist.
