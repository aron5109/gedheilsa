import Link from 'next/link';
import { ArrowRight, ShieldCheck, Heart, Leaf, ChartNoAxesCombined, Bell } from 'lucide-react';
import { Brand, Face } from '@/components/ui';
import { configured } from '@/lib/neon/auth';
export default async function Landing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="landing">
      <header className="landing-header">
        <Brand />
        <Link href="/personuvernd">
          Þín gögn. Þín ákvörðun. <ShieldCheck size={16} />
        </Link>
      </header>
      <main>
        <div className="landing-copy">
          <span className="landing-badge">
            <span />
            LÍÐAN Í ÞÍNUM TAKTI
          </span>
          <h1>
            Smá stund.
            <br />
            <em>Meiri hlýja.</em>
          </h1>
          <p className="landing-lead">
            Þitt rými til að staldra við, skrá líðan og finna það sem gerir þér gott. Eitt lítið
            skref í einu.
          </p>
          <div className="landing-cta">
            {configured() ? (
              <a className="button google-button" href="/auth/login">
                <span className="google-g" aria-hidden="true">
                  G
                </span>
                Halda áfram með Google <ArrowRight size={17} />
              </a>
            ) : (
              <span className="setup-note">Google-innskráning bíður uppsetningar.</span>
            )}
            <Link className="button secondary" href="/demo">
              Kíkja inn í Hlýju <ArrowRight size={17} />
            </Link>
          </div>
          {params.villa && <p className="form-error">Innskráning tókst ekki. Reyndu aftur.</p>}
          {params.uppsetning && (
            <p className="info-box">
              Ekki hefur verið tengdur gagnagrunnur við þessa útgáfu. Sýnishornið er opið og notar
              eingöngu tilbúnar færslur.
            </p>
          )}
          <p className="landing-fine">
            <ShieldCheck size={14} />Á íslensku. Á þínum forsendum. Fyrir 18 ára og eldri.
          </p>
        </div>
        <div className="landing-preview" aria-label="Dæmi um viðmót Hlýju">
          <div className="preview-top">
            <Heart size={22} />
            <span>Þín stund</span>
            <span className="preview-dot" />
          </div>
          <span className="eyebrow">GOTT AÐ ÞÚ SÉRT HÉR</span>
          <h2>
            Hvernig líður
            <br />
            þér í dag?
          </h2>
          <div className="preview-moods">
            {[1, 2, 3, 4, 5].map((score) => (
              <Face key={score} score={score} size={52} />
            ))}
          </div>
          <div className="preview-message">
            <Leaf size={24} />
            <div>
              <strong>Þú mátt taka þetta rólega.</strong>
              <p>Litlu hlutirnir telja líka.</p>
            </div>
          </div>
          <div className="preview-bars" aria-hidden="true">
            {[40, 60, 48, 78, 64, 82, 70].map((height, i) => (
              <div key={i}>
                <span style={{ height }} />
                <small>{['M', 'Þ', 'M', 'F', 'F', 'L', 'S'][i]}</small>
              </div>
            ))}
          </div>
        </div>
      </main>
      <section className="landing-features">
        <div>
          <ChartNoAxesCombined size={22} />
          <h3>Kynnstu þinni líðan</h3>
          <p>Skráðu augnablikin og sjáðu dagana, vikurnar og mánuðina í samhengi.</p>
        </div>
        <div>
          <Leaf size={22} />
          <h3>Finndu þín litlu skref</h3>
          <p>Hlýjar hugmyndir byggðar á því sem þér finnst gott að gera.</p>
        </div>
        <div>
          <Bell size={22} />
          <h3>Léttum aðeins á</h3>
          <p>Áminningar um venjur og tíma, með fólkið þitt nálægt ef þú vilt.</p>
        </div>
      </section>
      <footer>
        Hlýja styður við sjálfsskráningu og kemur ekki í stað heilbrigðisþjónustu.{' '}
        <Link href="/personuvernd">Nánar um þjónustuna</Link>
      </footer>
    </div>
  );
}
