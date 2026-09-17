import Link from 'next/link';
import { Brand, HelpCard } from '@/components/ui';
export default function Privacy() {
  return (
    <main className="policy-page">
      <Link href="/">
        <Brand />
      </Link>
      <span className="eyebrow">SKÝRT OG Á MANNAMEÐLI</span>
      <h1>Þín gögn. Þín ákvörðun.</h1>
      <p className="lead">
        Hlýja er í þróun. Þetta yfirlit lýsir því hvernig þessi útgáfa meðhöndlar gögn.
        Rekstraraðili þarf að birta fullbúna persónuverndarstefnu og tengiliðaupplýsingar áður en
        almenn notkun hefst.
      </p>
      <h2>Hvað er geymt?</h2>
      <p>
        Við Google-innskráningu berast auðkenni og grunnupplýsingar frá Google. Hlýja biður um nafn,
        valkvætt fæðingarár og það sem þér finnst gott að gera. Hún geymir aðeins þær upplýsingar um
        líðan, orku, svefn, vatn, hreyfingu, áminningar, tíma og stuðningsaðila sem þú velur að
        skrá.
      </p>
      <h2>Hver sér skráningarnar?</h2>
      <p>
        Aðgangur í appinu er bundinn við reikninginn þinn. Aðstandendur fá ekki aðgang að
        dagbókinni. Samþykktir þjónustuveitendur hýsa og vinna gögnin; rétt stillt aðgangsstýring og
        rekstur eru því nauðsynleg. Þessi útgáfa notar ekki dulkóðun þar sem aðeins notandinn hefur
        lykilinn.
      </p>
      <h2>Hvenær er haft samband við aðstandanda?</h2>
      <p>
        Aðeins ef þú virkjar það sérstaklega, samþykkir regluna og viðtakandi staðfestir þátttöku.
        Samliggjandi dagar þurfa raunverulegar skráningar; skráningarleysi er ekki túlkað sem
        vanlíðan. Send er almenn beiðni um samband með nafni þínu, en hvorki mæligildi, lyf né
        dagbókartexti. Þú getur slökkt á þessu og viðtakandi getur afþakkað frekari skilaboð.
      </p>
      <h2>Hvað ef samband rofnar?</h2>
      <p>
        Ef þú leyfir biðgeymslu á eigin tæki eru ósendar færslur geymdar í vafranum þar til vefþjónn
        staðfestir móttöku. Þær eru ekki dulkóðaðar sérstaklega fyrir þig í vafranum. Aðrir með
        aðgang að sama vafrasniði geta komist að þeim. Ekki hreinsa vafragögn meðan færslur bíða. Án
        biðgeymslu þarf nettengingu til að vista.
      </p>
      <h2>Útflutningur og eyðing</h2>
      <p>
        Þú getur sótt skapskráningar sem CSV og öll gögn sem JSON í Mitt rými. Tölvupóstsending
        krefst staðfestingar á viðtakanda og innihaldi. Venjulegur tölvupóstur er ekki örugg
        deilingargátt og afrit getur verið áframsent. Eyðing reiknings fjarlægir gögn úr virkri
        gagnageymslu; áður send afrit og dagatalsfærslur utan Hlýju eru áfram hjá viðtakendum.
        Öryggisafrit geta varðveist samkvæmt stillingum þjónustuveitanda.
      </p>
      <h2>Mikilvægt um þjónustuna</h2>
      <p>
        Hlýja er fyrir 18 ára og eldri. Hún greinir ekki sjúkdóma, metur ekki sjálfsvígshættu og
        veitir hvorki lyfjaráðgjöf né neyðareftirlit. Tilkynningar geta tafist eða mistekist. Ekki
        treysta á þær fyrir neyðaraðstoð eða tímanlega lyfjagjöf.
      </p>
      <HelpCard />
      <Link className="button secondary" href="/">
        Til baka
      </Link>
    </main>
  );
}
