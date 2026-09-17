# Öryggi

Ekki birta upplýsingar um notendur, raunverulegar heilsufarsfærslur, leyndarmál eða nýtanlega veikleika í opin GitHub-mál. Ábyrgðaraðili skal virkja GitHub Private Vulnerability Reporting eða birta viðeigandi einkasamskiptaleið áður en þjónusta er opnuð.

- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` og `VAPID_PRIVATE_KEY` eru leyndarmál á vefþjóni.
- Lyklar eru ekki geymdir í repository. `.env.example` inniheldur aðeins auða reiti og dæmi.
- Google identity token/session er sannreynt á server, auk RLS í gagnagrunni.
- API-svör fyrir gögn eru `private, no-store`. Service worker vistar ekki viðkvæmar síður eða API-gögn í cache.
- Push-payload inniheldur ekki lyfjaheiti, líðan eða dagbókartexta. Endpoints eru sannprófuð aftur við sendingu.
- Staðfestingarhlekkir aðstandenda eru slembnir 256-bita tokenar; aðeins hash er geymt. GET samþykkir aldrei boð.
- Heilsugögn fara ekki í aðgerðatengda application-loga. Stilltu hýsingarloga einnig til að sleppa tokenum/query strings á `/stadfesta`.
- Skráðu og skoðaðu þjónustuaðgang, afrit, lykilskipti og bilanaáætlanir áður en raunveruleg notkun hefst.

Sjá einnig [rekstur](docs/REKSTUR.md) og [arkitektúr](docs/ARKITEKTUR.md).
