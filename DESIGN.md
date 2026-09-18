---
name: Hlýja
description: Líðan í þínum takti — rólegt íslenskt viðmót.
colors:
  primary: '#355f4e'
  primary-deep: '#294d3f'
  background: '#f6f7f2'
  surface: '#ffffff'
  ink: '#283c34'
  muted: '#68746d'
  line: '#e6eae1'
  sage: '#eaf0e4'
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    fontSize: 1rem
    lineHeight: 1.6
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontWeight: 400
rounded:
  panel: 16px
  control: 12px
  sheet: 24px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
---

# Hönnunarkerfi Hlýju

## Overview

Rólegt rými með skýrri aðgerð. Hlýjan kemur úr eðlilegu íslensku máli, mjúkum litum og rúmum snertiflötum. Þetta er skráningarverkfæri sem á að vera þægilegt líka þegar orkan er lítil. Núverandi auðkenni er varðveitt; þetta skjal skráir útfært kerfi.

## Colors

Dökkgrænn fyrir aðgerðir og áherslu. Hlýr ljós bakgrunnur og hvítir vinnufletir. Fimm litir skapsvals fylgja skilgreiningum `MOODS` í `src/lib/domain/mood.ts`; texti og svipbrigði fylgja alltaf með. Litir eru ekki einkunn fyrir manneskjuna.

Normatífu grunngildin hér að ofan samsvara CSS-breytum í `src/app/globals.css`. Viðbótarlitir fyrir vatn, svefn og hreyfingu eru enn staðbundnir; ekki fullyrða að allir litir séu orðnir sameiginlegir hönnunartáknar.

## Typography

Kerfisletur í meginmáli, reitum, hnöppum og mæligögnum. Serif í vörumerki, aðalfyrirsögnum og orðum dagsins. Sérletur er ekki sótt frá þriðja aðila. Fyrirsagnir hafa fasta `rem`-stærð eftir skjástærð. Innsláttur er að lágmarki 1rem. Töluyfirlit notar jafnbreiðar tölur. Forðast hástafaformála sem endurtaka fyrirsögn.

## Layout

Hliðarvalmynd í tölvu og merkt valmynd neðst í síma. Aðalskjáir eru Í dag, Líðan, Áminningar og Mitt rými; URL-brot varðveitir valinn skjá án heilsugagna. Við 760px og minna verður efnið ein dálkaröð. Forgangur: skapsval, vatn/svefn/hreyfing, vikuyfirlit, daglegt efni og hugmyndir. Enginn skrollkrókur sem felur lárétt yfirflæði.

## Elevation & Depth

Vinnufletir aðskiljast fyrst með lit, bili eða fíngerðum ramma. Skapsvalið hefur engan skrautskugga. Gluggi og föst símavalmynd geta haft skugga til að sýna stöðu yfir efni. Engar skrautlegar inngangshreyfingar; `prefers-reduced-motion` er virt.

## Shapes

Endurnýtanlegir radíusar fyrir vinnufleti, stjórntæki og símaglugga eru í framhaus og CSS. Andlit eru teiknuð SVG-tákn; tákn úr Lucide fylgja sömu einföldu línutjáningu. Ekki nota tilbúnar línur sem líta út eins og raunveruleg svefngögn.

## Components

- **Skapsval:** fimm skýrir textakostir með svipbrigðum; 64px háar raðir í síma. Sama litamerking í yfirliti og skráningu.
- **Skráning:** valin líðan birtist stórt og má breyta. Orka og valkvæður texti eru sýnileg. Tilfinningar og tími opnast með `details`. Vistun er aðalaðgerð neðst.
- **Gluggar:** innbyggður `dialog`, föst fyrirsögn, Escape, læsing á bakgrunnsskrolli og endurheimt áherslu. Óvistaðar breytingar kalla á val um að halda áfram eða henda þeim. Ekki loka á meðan vistun stendur.
- **Hnappar:** a.m.k. 48 CSS px, skýr virk, valin, óvirk og lyklaborðsstaða. Einn aðalhnappur á hverri aðgerð.
- **Hugmyndir:** einfaldar raðir með texta og merktri aðgerð, ekki nýtt safn af jafnstórum auglýsingaspjöldum.
- **Tóm tímabil:** útskýra stöðuna og bjóða skráningu; aldrei túlka skráningarleysi sem vanlíðan.

## Do's and Don'ts

- Nota raunverulegar staðfestar skráningar; aðgreina sýnishorn og biðstöðu.
- Varðveita aðgengi við lagfæringar, sérstaklega 200% textastærð og lyklaborð.
- Velja stuttar, opnar spurningar án kröfu um hamingju.
- Ekki bæta við stigakeppni, heilbrigðisfullyrðingum eða þjónustuloforðum.
- Ekki láta almenn stílráð Impeccable yfirskrifa samþykki, íslensku eða þarfir Hlýju.
- Prófa tölvu og síma saman, laga staðfest vandamál og stöðva óþarfa smábreytingar þegar flæðið stenst.
