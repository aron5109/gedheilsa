'use client';
import {
  formatDate,
  formatNumber,
  shortWeekday,
  registrationCount,
  isSingular,
} from '@/lib/domain/format';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ArrowUpRight } from 'lucide-react';
import { MOODS, dayKey, addDays, filterMoods, dailyMoods } from '@/lib/domain/mood';
import type { MoodEntry } from '@/lib/domain/types';
import { Face, Empty } from './ui';
import { download } from '@/lib/client';
import { moodCsv } from '@/lib/domain/export';
export function MoodChart({
  entries,
  from,
  to,
  timezone,
  compact = false,
}: {
  entries: MoodEntry[];
  from: string;
  to: string;
  timezone: string;
  compact?: boolean;
}) {
  const days = dailyMoods(entries, from, to, timezone);
  return (
    <div className={'mood-chart ' + (compact ? 'chart-compact' : '')}>
      <div className="chart-labels" aria-hidden="true">
        <span>Mjög vel</span>
        <span>Ágætlega</span>
        <span>Mjög illa</span>
      </div>
      <div className="chart-body">
        <div className="chart-grid" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div
          className="chart-columns"
          role="img"
          aria-label={days
            .map(
              (d) =>
                `${d.date}: ${d.count ? `${d.average === null ? '—' : formatNumber(d.average)} af 5, ${registrationCount(d.count)}` : 'engin skráning'}`,
            )
            .join('. ')}
        >
          {days.map((d, i) => (
            <div className="chart-column" key={d.date}>
              <div className="chart-bar-area">
                {d.average !== null ? (
                  <div
                    className="chart-bar"
                    style={{
                      height: `${18 + (d.average - 1) * 20}%`,
                      background: MOODS[Math.round(d.average) - 1].color,
                    }}
                    title={`${d.date}: ${formatNumber(d.average)} af 5 (${d.count})`}
                  >
                    <span className="bar-cap" />
                  </div>
                ) : (
                  <div className="chart-missing" />
                )}
              </div>
              <span className="chart-date">
                {days.length <= 7
                  ? shortWeekday(d.date)
                  : i % 5 === 0 || i === days.length - 1
                    ? Number(d.date.slice(-2))
                    : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function periodBounds(anchor: string, mode: 'day' | 'week' | 'month') {
  if (mode === 'day') return { from: anchor, to: anchor };
  const d = new Date(anchor + 'T12:00Z');
  if (mode === 'week') {
    const from = addDays(anchor, -((d.getUTCDay() + 6) % 7));
    return { from, to: addDays(from, 6) };
  }
  return {
    from: anchor.slice(0, 7) + '-01',
    to: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12))
      .toISOString()
      .slice(0, 10),
  };
}
export function History({
  entries,
  timezone,
  pendingIds,
  onShare,
}: {
  entries: MoodEntry[];
  timezone: string;
  pendingIds: string[];
  onShare: () => void;
}) {
  const [mode, setMode] = useState<'day' | 'week' | 'month'>('week'),
    [anchor, setAnchor] = useState(() => dayKey(new Date(), timezone)),
    [notes, setNotes] = useState(false);
  const { from, to } = periodBounds(anchor, mode);
  const selected = filterMoods(entries, from, to, timezone);
  const average = selected.length
    ? selected.reduce((s, e) => s + e.score, 0) / selected.length
    : null;
  const counts = MOODS.map((m) => selected.filter((e) => e.score === m.score).length);
  const frequent = selected.length ? MOODS[counts.indexOf(Math.max(...counts))] : null;
  function move(dir: number) {
    if (mode === 'month') {
      const d = new Date(anchor.slice(0, 7) + '-01T12:00Z');
      d.setUTCMonth(d.getUTCMonth() + dir);
      setAnchor(d.toISOString().slice(0, 10));
    } else setAnchor(addDays(anchor, dir * (mode === 'week' ? 7 : 1)));
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LÍÐAN YFIR TÍMA</span>
          <h1>Dagarnir þínir.</h1>
          <p className="muted">Lítið yfirlit getur hjálpað þér að sjá stærri myndina.</p>
        </div>
        <button className="button secondary" onClick={onShare}>
          Deila yfirliti <ArrowUpRight size={16} />
        </button>
      </div>
      <section className="card">
        <div className="history-controls">
          <div className="segmented">
            {(['day', 'week', 'month'] as const).map((m, i) => (
              <button
                className={mode === m ? 'active' : ''}
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
              >
                {['Dagur', 'Vika', 'Mánuður'][i]}
              </button>
            ))}
          </div>
          <div className="period-picker">
            <button className="icon-button" aria-label="Fyrra tímabil" onClick={() => move(-1)}>
              <ChevronLeft size={20} />
            </button>
            <label className="sr-only" htmlFor="history-date">
              Dagsetning á tímabili
            </label>
            <input
              id="history-date"
              type="date"
              value={anchor}
              onChange={(e) => {
                if (e.target.value) setAnchor(e.target.value);
              }}
            />
            <button className="icon-button" aria-label="Næsta tímabil" onClick={() => move(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="history-summary">
          <div>
            <span className="muted small">Skráningar á tímabilinu</span>
            <strong>
              {selected.length}
              <small> {isSingular(selected.length) ? 'skráning' : 'skráningar'}</small>
            </strong>
          </div>
          <div>
            <span className="muted small">Algengasta líðan</span>
            <strong className="frequent-mood">
              {frequent ? (
                <>
                  <Face score={frequent.score} size={36} />
                  {frequent.label}
                </>
              ) : (
                'Engar skráningar'
              )}
            </strong>
          </div>
          <div>
            <span className="muted small">Meðaltal skráninga</span>
            <strong>
              {average !== null ? formatNumber(average) : '—'}
              <small> af 5</small>
            </strong>
          </div>
        </div>
        {selected.length ? (
          <MoodChart entries={entries} from={from} to={to} timezone={timezone} />
        ) : (
          <Empty title="Hér fær líðanin þín pláss.">
            Engin líðan hefur verið skráð á þessu tímabili.
          </Empty>
        )}
        <p className="chart-note">
          Súlur sýna meðaltal hvers dags. Punktur merkir að skráningu vantar. Meðaltöl eru lýsandi
          yfirlit, ekki heilsumat.
        </p>
        <div className="mood-distribution">
          {MOODS.map((m, i) => (
            <div key={m.score}>
              <Face score={m.score} size={32} />
              <span>{m.label}</span>
              <strong>
                {selected.length ? Math.round((counts[i] / selected.length) * 100) : 0}%
              </strong>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-heading">
          <h2>Skráningarnar þínar</h2>
          <button
            className="text-button"
            disabled={!selected.length}
            onClick={() =>
              download(
                `hlyja-${from}-${to}.csv`,
                moodCsv(selected, notes),
                'text/csv;charset=utf-8',
              )
            }
          >
            Sækja CSV <Download size={15} />
          </button>
        </div>
        <label className="checkbox small">
          <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
          <span>Hafa dagbókartexta með í útflutningi</span>
        </label>
        <div className="entry-list">
          {selected
            .slice()
            .reverse()
            .map((e) => (
              <article className="entry-row" key={e.id}>
                <Face score={e.score} size={42} />
                <div>
                  <strong>{MOODS[e.score - 1].label}</strong>
                  <span className="muted small">
                    {formatDate(e.occurred_at, timezone, { year: true, time: true })} · Orka{' '}
                    {e.energy}/5{pendingIds.includes(e.id) && ' · Bíður sendingar'}
                  </span>
                  {e.emotions.length > 0 && (
                    <p className="emotion-text">{e.emotions.join(' · ')}</p>
                  )}
                  {e.note && <p className="entry-note">{e.note}</p>}
                </div>
              </article>
            ))}
        </div>
      </section>
    </>
  );
}
