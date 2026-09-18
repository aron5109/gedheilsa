// Original Icelandic encouragement, not quotations attributed to other people.
// Keep these short, kind, and free of promises about recovery or pressure to feel happy.
export const DAILY_WORDS = [
  'Þú mátt taka daginn á þínum hraða.',
  'Það þarf ekki að gera allt í einu.',
  'Gefðu þér sömu hlýju og þú myndir gefa góðum vini.',
  'Það er í lagi að þurfa smá næði.',
  'Eitt lítið skref getur verið nóg í bili.',
  'Þú mátt biðja um félagsskap, líka án þess að finna réttu orðin.',
  'Það sem þér finnst skiptir máli.',
  'Það má breyta áætluninni þegar dagurinn kallar á það.',
  'Hvíld þarf ekki að vera verðlaun fyrir afköst.',
  'Þú mátt njóta þess sem er gott, þótt ekki sé allt auðvelt.',
  'Þú þarft ekki að útskýra allt til að eiga skilið hlýju.',
  'Stutt samtal má byrja á einföldu hæ.',
  'Lítill hlutur sem þú nýtur má fá pláss í dag.',
  'Það er í lagi að vita ekki alveg hvernig þér líður.',
  'Þú mátt segja nei og gefa þér svigrúm.',
  'Þú þarft ekki að bera allt uppi á eigin spýtur.',
  'Það má byrja smátt, líka þegar hugmyndirnar eru stórar.',
  'Gefðu þér augnablik áður en þú heldur áfram.',
  'Er eitthvað lítið sem þú gætir gert fyrir þig í dag?',
  'Þú mátt velja það sem hentar þér núna.',
  'Róleg stund getur fengið að vera bara róleg stund.',
  'Það er í lagi að skipta um skoðun.',
  'Þú mátt taka eftir góðri stund án þess að halda fast í hana.',
  'Þú ert meira en afköstin þín.',
  'Sumt má bíða. Þú mátt líka hvíla þig.',
  'Það þarf ekki sérstakt tilefni til að heyra í einhverjum.',
  'Þú mátt gera eitthvað bara af því að þér finnst það gott.',
  'Það er engin keppni í því að hafa allt á hreinu.',
  'Þú þarft ekki að finna lausn á öllu í dag.',
  'Þínar þarfir mega líka fá athygli.',
  'Líðanin má breytast. Hér er pláss fyrir hana alla.',
] as const;

export const FACT_SOURCES = {
  water: {
    label: 'CDC',
    url: 'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html',
  },
  sleep: {
    label: 'NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects',
  },
  habits: {
    label: 'NHLBI',
    url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  movement: {
    label: 'Alþjóðaheilbrigðismálastofnunin',
    url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  },
} as const;

export const DAILY_FACTS: ReadonlyArray<{
  id: string;
  title: string;
  text: string;
  invitation: string;
  source: keyof typeof FACT_SOURCES;
}> = [
  {
    id: 'water-body',
    title: 'Smá vatn, einföld umhyggja.',
    text: 'Vatn hjálpar líkamanum að starfa eðlilega og viðhalda hæfilegum líkamshita.',
    invitation: 'Kannski er gott að hafa vatnsglas við höndina.',
    source: 'water',
  },
  {
    id: 'sleep-mood',
    title: 'Svefninn skiptir máli.',
    text: 'Svefn styður við starfsemi heilans. Of lítill svefn getur gert erfiðara að takast á við tilfinningar.',
    invitation: 'Gefðu hvíldinni pláss eftir því sem þú getur.',
    source: 'sleep',
  },
  {
    id: 'movement-everyday',
    title: 'Hreyfing er líka hversdagsleg.',
    text: 'Gönguferðir, hjólreiðar, leikur og heimilisverk geta öll verið hluti af daglegri hreyfingu.',
    invitation: 'Veldu eitthvað sem þér finnst gott og hentar líkamanum þínum.',
    source: 'movement',
  },
  {
    id: 'sleep-rhythm',
    title: 'Rólegur taktur fyrir svefninn.',
    text: 'Svipaður háttatími og fótaferðartími frá degi til dags getur stutt við svefnvenjur.',
    invitation: 'Lítil venja getur verið góð byrjun.',
    source: 'habits',
  },
  {
    id: 'water-needs',
    title: 'Þínar þarfir eru þínar.',
    text: 'Vökvaþörf er mismunandi. Hún fer meðal annars eftir aldri, hreyfingu og aðstæðum.',
    invitation: 'Vatnsmarkmiðið í Hlýju er þín eigin stilling.',
    source: 'water',
  },
  {
    id: 'sleep-attention',
    title: 'Hvíld fyrir hugann.',
    text: 'Nægur svefn styður meðal annars við athygli, minni og nám.',
    invitation: 'Þú mátt gefa þér tíma til að hvílast.',
    source: 'sleep',
  },
  {
    id: 'movement-wellbeing',
    title: 'Hreyfing á þínum forsendum.',
    text: 'Regluleg hreyfing getur stutt við andlega líðan og svefn.',
    invitation: 'Það má velja hreyfingu sem þú nýtur og taka hana á þínum hraða.',
    source: 'movement',
  },
  {
    id: 'sleep-evening',
    title: 'Mýkri endir á deginum.',
    text: 'Róleg stund og minna bjart skjáljós fyrir háttinn geta hjálpað við að búa sig undir svefn.',
    invitation: 'Kannski hentar bók, rólegt lag eða smá kyrrð í kvöld.',
    source: 'habits',
  },
  {
    id: 'water-sources',
    title: 'Vatn er góður kostur.',
    text: 'Venjulegt drykkjarvatn hjálpar til við að mæta vökvaþörf. Vökvi úr mat og öðrum drykkjum telur líka.',
    invitation: 'Einfalt vatnsglas getur átt sinn stað við máltíðina.',
    source: 'water',
  },
  {
    id: 'sleep-day',
    title: 'Nóttin fylgir okkur inn í daginn.',
    text: 'Svefn hefur áhrif á hvernig okkur líður og gengur að einbeita okkur yfir daginn.',
    invitation: 'Ef nóttin var erfið má dagurinn fá aðeins meira svigrúm.',
    source: 'sleep',
  },
  {
    id: 'movement-variety',
    title: 'Margar leiðir til að hreyfa sig.',
    text: 'Hreyfing getur verið hluti af samgöngum, frítíma eða daglegum verkefnum.',
    invitation: 'Hvaða hreyfing finnst þér skemmtileg?',
    source: 'movement',
  },
  {
    id: 'sleep-room',
    title: 'Notalegt rými fyrir nóttina.',
    text: 'Hljóðlátt, svalt og dimmt svefnherbergi getur stutt við góðar svefnvenjur.',
    invitation: 'Ein lítil breyting getur verið nóg til að byrja með.',
    source: 'habits',
  },
];

// A calendar-day index, not elapsed local hours: stable across refreshes and DST.
export function dayIndex(day: string, length: number): number {
  const milliseconds = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString().slice(0, 10) !== day)
    throw new Error('Ógild dagsetning.');
  const ordinal = Math.floor(milliseconds / 86400000);
  return ((ordinal % length) + length) % length;
}

export function dailyContent(day: string) {
  return {
    words: DAILY_WORDS[dayIndex(day, DAILY_WORDS.length)],
    fact: DAILY_FACTS[dayIndex(day, DAILY_FACTS.length)],
  };
}
