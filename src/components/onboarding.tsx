'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowLeft, Check, Leaf, Sparkles, ShieldCheck } from 'lucide-react';
import { Brand, ErrorMessage } from './ui';
import { INTERESTS } from '@/lib/domain/mood';
import type { Profile } from '@/lib/domain/types';
export function Onboarding({
  onSave,
  demo = false,
}: {
  onSave: (value: Record<string, unknown>, local: boolean) => Promise<void>;
  demo?: boolean;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(''),
    [year, setYear] = useState(''),
    [interests, setInterests] = useState<string[]>([]),
    [comfort, setComfort] = useState(''),
    [consent, setConsent] = useState(false),
    [adult, setAdult] = useState(false),
    [local, setLocal] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(
        {
          name: name.trim(),
          birth_year: year ? Number(year) : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Atlantic/Reykjavik',
          interests,
          comfort_activities: comfort.trim()
            ? comfort
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          water_goal_ml: 1500,
          support_enabled: false,
          support_days: 3,
          health_consent: consent,
          adult_confirmed: adult,
          support_consent: false,
          onboarding_completed: true,
        },
        local,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="onboarding">
      <Link href="/" className="onboard-brand">
        <Brand />
      </Link>
      <div className="onboard-card">
        <div className="step-dots" aria-label={`Skref ${step + 1} af 3`}>
          {[0, 1, 2].map((i) => (
            <span className={i <= step ? 'active' : ''} key={i} />
          ))}
        </div>
        <div className="onboard-symbol">
          {step === 0 ? <Leaf /> : step === 1 ? <Sparkles /> : <ShieldCheck />}
        </div>
        <span className="eyebrow">SMÁ KYNNING, Á ÞÍNUM FORSENDUM</span>
        <h1>
          {['Velkomin í þitt rými.', 'Hvað gerir þér gott?', 'Þú stjórnar þínum gögnum.'][step]}
        </h1>
        <p className="lead">
          {
            [
              'Við byrjum á því einfalda. Þú getur breytt þessum upplýsingum síðar.',
              'Það er oft gott að eiga litla áminningu um það sem veitir manni hlýju.',
              'Líðan er persónuleg. Hlýja deilir engu með aðstandendum nema þú veljir það sérstaklega.',
            ][step]
          }
        </p>
        <form onSubmit={submit}>
          {step === 0 && (
            <>
              <label>
                Hvað eigum við að kalla þig?
                <input
                  autoFocus
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fornafnið þitt"
                  autoComplete="given-name"
                />
              </label>
              <label>
                Fæðingarár <span className="optional">(valkvætt)</span>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() - 18}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Til dæmis 1988"
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  required
                  checked={adult}
                  onChange={(e) => setAdult(e.target.checked)}
                />
                <span>Ég er 18 ára eða eldri.</span>
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <fieldset>
                <legend>Veldu það sem á við þig.</legend>
                <div className="chips">
                  {INTERESTS.map((item) => (
                    <button
                      type="button"
                      className={'chip ' + (interests.includes(item) ? 'selected' : '')}
                      aria-pressed={interests.includes(item)}
                      key={item}
                      onClick={() =>
                        setInterests(
                          interests.includes(item)
                            ? interests.filter((x) => x !== item)
                            : [...interests, item],
                        )
                      }
                    >
                      {interests.includes(item) && <Check size={14} />} {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Eitthvað sem þér þykir sérstaklega gott að gera?
                <textarea
                  rows={3}
                  maxLength={600}
                  value={comfort}
                  onChange={(e) => setComfort(e.target.value)}
                  placeholder="Til dæmis að ganga við sjóinn eða hlusta á uppáhaldslag. Eitt atriði í hverja línu."
                />
              </label>
              <p className="muted small">Þú mátt alveg sleppa þessu og bæta við síðar.</p>
            </>
          )}
          {step === 2 && (
            <>
              <div className="info-box">
                Hlýja hjálpar þér að skrá og skoða líðan. Hún veitir ekki greiningu, lyfjaráðgjöf
                eða neyðareftirlit.
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Ég samþykki að Hlýja geymi skráningar mínar um líðan, venjur og heilsu til að
                  veita þessa þjónustu. Ég get flutt gögnin út og eytt reikningnum.{' '}
                  <a href="/personuvernd" target="_blank" rel="noreferrer">
                    Lesa um gögnin mín.
                  </a>
                </span>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={local}
                  onChange={(e) => setLocal(e.target.checked)}
                />
                <span>
                  Leyfa biðgeymslu á þessu tæki þegar samband rofnar. Veldu þetta aðeins á eigin
                  tæki. Biðfærslur eru geymdar í vafranum þar til sending tekst.
                </span>
              </label>
              {demo && (
                <p className="demo-notice">
                  Þetta er sýnishorn. Engar upplýsingar verða sendar á vefþjón.
                </p>
              )}
            </>
          )}
          <ErrorMessage message={error} />
          <div className="onboard-actions">
            {step > 0 && (
              <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={17} />
                Til baka
              </button>
            )}
            <button className="button" disabled={busy}>
              {busy ? 'Vista…' : step === 2 ? 'Opna Hlýju' : 'Halda áfram'}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
      <p className="onboard-footer">Eitt lítið skref í einu.</p>
    </div>
  );
}
export function profilePayload(profile: Profile) {
  return {
    ...profile,
    health_consent: true,
    adult_confirmed: true,
    support_consent: profile.support_enabled,
    onboarding_completed: true,
  };
}
