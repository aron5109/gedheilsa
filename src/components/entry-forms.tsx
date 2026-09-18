'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ArrowRight, Heart, ChevronDown } from 'lucide-react';
import { Modal, Face, ErrorMessage, HelpCard } from './ui';
import { MOODS, EMOTIONS } from '@/lib/domain/mood';
import type { MoodEntry, MoodScore, WellbeingEntry } from '@/lib/domain/types';
function inputNow() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function MoodForm({
  initialScore,
  onSave,
  onClose,
}: {
  initialScore?: MoodScore;
  onSave: (entry: MoodEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [score, setScore] = useState<MoodScore | undefined>(initialScore),
    [energy, setEnergy] = useState(3),
    [emotions, setEmotions] = useState<string[]>([]),
    [note, setNote] = useState(''),
    [time, setTime] = useState(inputNow),
    [initialTime] = useState(time),
    [showMoods, setShowMoods] = useState(!initialScore),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const selectedMood = MOODS.find((m) => m.score === score);
  const dirty =
    !done &&
    (note.length > 0 ||
      emotions.length > 0 ||
      energy !== 3 ||
      time !== initialTime ||
      score !== initialScore);
  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!score || busy) return;
    setError('');
    setBusy(true);
    try {
      await onSave({
        id,
        score,
        energy,
        emotions,
        note,
        occurred_at: new Date(time).toISOString(),
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={done ? 'Takk fyrir að gefa þér stund.' : 'Hvernig líður þér núna?'}
      onClose={onClose}
      dirty={dirty}
      busy={busy}
    >
      {done ? (
        <div className="entry-success">
          <Face score={score ?? 3} size={90} />
          <h3 ref={successRef} tabIndex={-1}>
            Líðanin þín skiptir máli.
          </h3>
          <p>
            Færslan er komin í yfirlitið þitt. Efst sérðu hvort hún er vistuð eða bíður sendingar.
          </p>
          {score && score <= 2 && <HelpCard compact />}
          <button className="button" onClick={onClose}>
            Til baka í daginn <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mood-entry-form" aria-busy={busy}>
          <fieldset className="form-fields" disabled={busy}>
            <p className="muted">Gefðu þér augnablik. Þú ræður hvað þú skráir með líðaninni.</p>
            {selectedMood && !showMoods && (
              <button
                ref={selectedRef}
                type="button"
                className="selected-mood-summary"
                aria-label={`${selectedMood.label}, breyta líðan`}
                aria-pressed="true"
                aria-expanded={false}
                aria-controls="mood-choices"
                onClick={() => {
                  setShowMoods(true);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>('#mood-choices [aria-pressed="true"]')
                      ?.focus(),
                  );
                }}
              >
                <Face score={selectedMood.score} size={64} />
                <span>
                  <small>Valin líðan</small>
                  <strong>{selectedMood.label}</strong>
                </span>
                <span className="change-mood" aria-hidden="true">
                  Breyta <ChevronDown size={16} />
                </span>
              </button>
            )}
            <fieldset className="mood-fieldset" id="mood-choices" hidden={!showMoods}>
              <legend className="sr-only">Veldu líðan</legend>
              <div className="mood-options">
                {MOODS.map((m) => (
                  <button
                    type="button"
                    key={m.score}
                    className={'mood-option ' + (m.score === score ? 'selected' : '')}
                    aria-pressed={m.score === score}
                    onClick={() => {
                      setScore(m.score);
                      setShowMoods(false);
                      requestAnimationFrame(() => selectedRef.current?.focus());
                    }}
                  >
                    <Face score={m.score} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <details className="entry-details">
              <summary>
                Tilfinningar og tími <span className="optional">Valkvætt</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <fieldset>
                <legend>
                  Hvaða tilfinningar finnurðu fyrir? <span className="optional">(valkvætt)</span>
                </legend>
                <div className="chips">
                  {EMOTIONS.map((item) => (
                    <button
                      type="button"
                      className={'chip ' + (emotions.includes(item) ? 'selected' : '')}
                      aria-pressed={emotions.includes(item)}
                      key={item}
                      onClick={() =>
                        setEmotions(
                          emotions.includes(item)
                            ? emotions.filter((x) => x !== item)
                            : [...emotions, item],
                        )
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Tími skráningar <span className="optional">(tímabelti tækisins)</span>
                <input
                  required
                  type="datetime-local"
                  max={inputNow()}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onInvalid={(e) => {
                    const details = e.currentTarget.closest('details');
                    if (details) details.open = true;
                  }}
                />
              </label>
            </details>
            <label>
              Hversu mikla orku hefurðu? <span className="range-value">{energy} af 5</span>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
              />
              <span className="range-labels">
                <span>Litla orku</span>
                <span>Mikla orku</span>
              </span>
            </label>
            <label>
              Viltu bæta einhverju við? <span className="optional">(valkvætt)</span>
              <textarea
                rows={2}
                maxLength={4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nokkur orð um stundina, ef þú vilt."
              />
            </label>
            <ErrorMessage message={error} />
            {score === 1 && (
              <div className="inline-support">
                <Heart size={18} />
                <p>
                  Þú þarft ekki að takast á við þetta á eigin spýtur. <a href="tel:1717">1717</a> er
                  til staðar fyrir samtal. Í bráðri hættu: <a href="tel:112">112</a>.
                </p>
              </div>
            )}
            <div className="entry-actions">
              <button className="button full" disabled={!score || busy}>
                {busy ? 'Vista færslu…' : 'Skrá líðan'}
                <Check size={17} />
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
export function WellbeingForm({
  kind,
  onSave,
  onClose,
}: {
  kind: WellbeingEntry['kind'];
  onSave: (entry: WellbeingEntry) => Promise<void>;
  onClose: () => void;
}) {
  const labels = {
    water: ['Vatn', 'Magn í millilítrum', '250', 5000],
    sleep: ['Svefn', 'Svefn í klukkustundum', '7.5', 24],
    movement: ['Hreyfing', 'Lengd í mínútum', '15', 1440],
    steps: ['Skref', 'Fjöldi skrefa', '1000', 100000],
  } as const;
  const [id] = useState(() => crypto.randomUUID()),
    [value, setValue] = useState<string>(labels[kind][2]),
    [time, setTime] = useState(inputNow),
    [initialTime] = useState(time),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onSave({
        id,
        kind,
        value: Number(value),
        occurred_at: new Date(time).toISOString(),
        source: 'manual',
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={'Skrá ' + labels[kind][0].toLowerCase()}
      onClose={onClose}
      busy={busy}
      dirty={value !== labels[kind][2] || time !== initialTime}
    >
      <form onSubmit={submit}>
        <p className="muted">
          {kind === 'sleep'
            ? 'Skráðu svefninn þegar þú vaknar. Nýjasta skráning dagsins birtist á yfirlitinu.'
            : kind === 'steps'
              ? 'Handvirk skráning. Sjálfvirk tenging við Apple Health og Samsung Health kemur síðar.'
              : 'Skráningin bætist við daginn þinn.'}
        </p>
        <label>
          {labels[kind][1]}
          <input
            required
            type="number"
            min="0"
            max={labels[kind][3]}
            step={kind === 'sleep' ? '0.25' : '1'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Tími <span className="optional">(tímabelti tækisins)</span>
          <input
            required
            type="datetime-local"
            max={inputNow()}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <ErrorMessage message={error} />
        <button className="button full" disabled={busy}>
          {busy ? 'Vista…' : 'Vista skráningu'}
          <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
