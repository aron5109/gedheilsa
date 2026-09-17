'use client';
import { formatDate } from '@/lib/domain/format';
import { useState, type FormEvent } from 'react';
import {
  Plus,
  Pill,
  CalendarDays,
  Bell,
  Check,
  Download,
  ExternalLink,
  Trash2,
  Clock,
} from 'lucide-react';
import type { AppData, Routine, RoutineLog, Appointment } from '@/lib/domain/types';
import { dayKey, localTime } from '@/lib/domain/mood';
import { appointmentIcs, googleCalendarUrl } from '@/lib/domain/export';
import { api, download } from '@/lib/client';
import { Modal, ErrorMessage, Empty } from './ui';
const routineLabel = { medication: 'Lyf', mood: 'Líðan', water: 'Vatn', sleep: 'Svefn' };
export function Reminders({
  data,
  demo,
  onChange,
  pushReady,
}: {
  data: AppData;
  demo: boolean;
  onChange: (next: AppData) => void;
  pushReady: boolean;
}) {
  const [modal, setModal] = useState<'routine' | 'appointment' | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [details, setDetails] = useState(false);
  const timezone = data.profile?.timezone ?? 'Atlantic/Reykjavik';
  const now = new Date(),
    today = dayKey(now, timezone),
    time = localTime(now, timezone);
  async function log(routine: Routine, slot: string, status: RoutineLog['status']) {
    setBusy(routine.id + slot);
    setError('');
    try {
      const value: RoutineLog = {
        id: crypto.randomUUID(),
        routine_id: routine.id,
        scheduled_date: today,
        scheduled_time: slot,
        status,
      };
      const saved = demo ? value : await api<RoutineLog>('/api/routine-logs', 'POST', value);
      onChange({ ...data, routineLogs: [...data.routineLogs, saved] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function toggle(routine: Routine) {
    setBusy(routine.id);
    setError('');
    try {
      const value = { ...routine, enabled: !routine.enabled };
      const saved = demo ? value : await api<Routine>('/api/routines', 'POST', value);
      onChange({ ...data, routines: data.routines.map((r) => (r.id === saved.id ? saved : r)) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function remove(a: Appointment) {
    if (
      !confirm(
        `Fjarlægja tímann „${a.title}“ úr Hlýju? Afrit í öðrum dagatölum eyðast ekki sjálfkrafa.`,
      )
    )
      return;
    setBusy(a.id);
    setError('');
    try {
      if (!demo) await api('/api/appointments', 'DELETE', { id: a.id });
      onChange({ ...data, appointments: data.appointments.filter((x) => x.id !== a.id) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LITLAR ÁMINNINGAR, LÉTTARI DAGUR</span>
          <h1>Í þínum takti.</h1>
          <p className="muted">Það er gott að þurfa ekki að muna allt.</p>
        </div>
        <button className="button" onClick={() => setModal('routine')}>
          <Plus size={18} />
          Ný áminning
        </button>
      </div>
      {!pushReady && (
        <p className="info-box">
          Áminningar birtast hér í appinu. Tilkynningar þegar appið er lokað bíða tengingar við
          tilkynningaþjónustu. Dagatalsútflutningur er í boði.
        </p>
      )}
      <ErrorMessage message={error} />
      <section className="card">
        <div className="card-heading">
          <h2>Daglegar áminningar</h2>
          <span className="muted small">{timezone}</span>
        </div>
        {!data.routines.length ? (
          <Empty title="Smá hjálp við að muna.">
            Bættu við áminningu um líðan, lyf, vatn eða háttatíma.
          </Empty>
        ) : (
          <div className="routine-list">
            {data.routines.map((r) => (
              <article className="routine-item" key={r.id}>
                <div className="routine-title">
                  <span className={'tile-icon ' + (r.kind === 'medication' ? 'lavender' : 'sage')}>
                    {r.kind === 'medication' ? <Pill size={21} /> : <Bell size={21} />}
                  </span>
                  <div>
                    <strong>{r.title}</strong>
                    <span className="muted small">
                      {routineLabel[r.kind]} · {r.times.join(' og ')}
                      {!r.enabled ? ' · Í hléi' : ''}
                    </span>
                  </div>
                  <button
                    className="text-button"
                    disabled={busy === r.id}
                    onClick={() => toggle(r)}
                  >
                    {r.enabled ? 'Setja í hlé' : 'Virkja'}
                  </button>
                </div>
                {r.enabled && (
                  <div className="routine-slots">
                    {r.times.map((slot) => {
                      const record = data.routineLogs.find(
                        (l) =>
                          l.routine_id === r.id &&
                          l.scheduled_date === today &&
                          l.scheduled_time === slot,
                      );
                      return (
                        <div key={slot}>
                          <span>
                            <Clock size={14} />
                            {slot}
                          </span>
                          {record ? (
                            <span
                              className={'status-pill ' + (record.status === 'taken' ? 'good' : '')}
                            >
                              {record.status === 'taken' ? (
                                <>
                                  <Check size={13} />
                                  {r.kind === 'medication' ? 'Tekið' : 'Lokið'}
                                </>
                              ) : (
                                'Sleppt'
                              )}
                            </span>
                          ) : (
                            <div className="button-row">
                              <button
                                className="button small-button secondary"
                                disabled={slot > time || busy === r.id + slot}
                                onClick={() => log(r, slot, 'taken')}
                              >
                                {r.kind === 'medication' ? 'Búið að taka' : 'Lokið'}
                              </button>
                              <button
                                className="text-button small"
                                disabled={slot > time || busy === r.id + slot}
                                onClick={() => log(r, slot, 'skipped')}
                              >
                                Sleppa
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        <p className="footnote">
          Skráning staðfestir aðeins það sem þú velur. Hlýja leggur ekki til skammta eða breytingar
          á lyfjum. Leitaðu til læknis eða lyfjafræðings ef þú ert óviss um gleymdan skammt.
        </p>
      </section>
      <section className="card">
        <div className="card-heading">
          <h2>Læknistímar og annað á dagskrá</h2>
          <button className="text-button" onClick={() => setModal('appointment')}>
            <Plus size={16} />
            Bæta við tíma
          </button>
        </div>
        <label className="checkbox small">
          <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} />
          <span>
            Hafa heiti og staðsetningu með í dagatalsútflutningi. Annars birtist aðeins „Frátekinn
            tími“.
          </span>
        </label>
        {data.appointments.length === 0 ? (
          <Empty title="Rými fyrir það sem er fram undan.">
            Bættu við tíma og færðu hann í dagatalið í símanum þínum.
          </Empty>
        ) : (
          data.appointments
            .slice()
            .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
            .map((a) => (
              <article className="appointment-item" key={a.id}>
                <span className="tile-icon peach">
                  <CalendarDays size={22} />
                </span>
                <div>
                  <h3>{a.title}</h3>
                  <p className="muted small">
                    {formatDate(a.starts_at, timezone, { weekday: true, year: true, time: true })}
                  </p>
                  {a.location && <p className="small">{a.location}</p>}
                  <div className="calendar-actions">
                    <button
                      className="text-button"
                      onClick={() =>
                        download(
                          'hlyja-timi.ics',
                          appointmentIcs(a, details),
                          'text/calendar;charset=utf-8',
                        )
                      }
                    >
                      <Download size={14} />
                      Apple / iCal (.ics)
                    </button>
                    <a
                      className="text-button"
                      href={googleCalendarUrl(a, details)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Google-dagatal <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <button
                  className="icon-button"
                  disabled={busy === a.id}
                  aria-label={`Fjarlægja ${a.title}`}
                  onClick={() => remove(a)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
        )}
      </section>
      {modal === 'routine' && (
        <RoutineForm
          onClose={() => setModal(null)}
          onSave={async (value) => {
            const saved = demo ? value : await api<Routine>('/api/routines', 'POST', value);
            onChange({ ...data, routines: [...data.routines, saved] });
            setModal(null);
          }}
        />
      )}
      {modal === 'appointment' && (
        <AppointmentForm
          onClose={() => setModal(null)}
          onSave={async (value) => {
            const saved = demo ? value : await api<Appointment>('/api/appointments', 'POST', value);
            onChange({ ...data, appointments: [...data.appointments, saved] });
            setModal(null);
          }}
        />
      )}
    </>
  );
}
function RoutineForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (value: Routine) => Promise<void>;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [title, setTitle] = useState(''),
    [kind, setKind] = useState<Routine['kind']>('mood'),
    [times, setTimes] = useState(['20:00']),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ id, title, kind, times: [...new Set(times)].sort(), enabled: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Ný áminning" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Tegund
          <select value={kind} onChange={(e) => setKind(e.target.value as Routine['kind'])}>
            {Object.entries(routineLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {kind === 'medication' ? 'Heiti lyfs eða áminningar' : 'Hvað viltu muna?'}
          <input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'medication' ? 'Til dæmis morgunlyf' : 'Til dæmis skrá líðan'}
          />
        </label>
        <fieldset>
          <legend>Á hvaða tímum á hverjum degi?</legend>
          <div className="time-inputs">
            {times.map((time, i) => (
              <label key={i}>
                <span className="sr-only">Tími {i + 1}</span>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTimes(times.map((t, j) => (i === j ? e.target.value : t)))}
                />
                {i > 0 && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setTimes(times.filter((_, j) => j !== i))}
                  >
                    Fjarlægja
                  </button>
                )}
              </label>
            ))}
          </div>
          {times.length < 8 && (
            <button
              type="button"
              className="text-button"
              onClick={() => setTimes([...times, '12:00'])}
            >
              <Plus size={14} />
              Annar tími
            </button>
          )}
        </fieldset>
        <p className="small muted">
          Tímarnir fylgja tímabeltinu í prófílnum þínum. Tilkynningar á læstum skjá sýna aðeins
          almenna áminningu.
        </p>
        <ErrorMessage message={error} />
        <button className="button full" disabled={busy}>
          {busy ? 'Vista…' : 'Vista áminningu'}
        </button>
      </form>
    </Modal>
  );
}
function AppointmentForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (value: Appointment) => Promise<void>;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [title, setTitle] = useState(''),
    [start, setStart] = useState(''),
    [duration, setDuration] = useState(30),
    [location, setLocation] = useState(''),
    [reminder, setReminder] = useState(60),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        id,
        title,
        starts_at: new Date(start).toISOString(),
        duration_minutes: duration,
        location,
        reminder_minutes: reminder,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Bæta við tíma" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Heiti
          <input
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Til dæmis viðtal"
          />
        </label>
        <label>
          Dagsetning og tími <span className="optional">(tímabelti tækisins)</span>
          <input
            required
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <div className="form-columns">
          <label>
            Lengd í mínútum
            <input
              required
              type="number"
              min="5"
              max="480"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          <label>
            Áminning
            <select value={reminder} onChange={(e) => setReminder(Number(e.target.value))}>
              <option value="15">15 mínútum áður</option>
              <option value="60">Klukkustund áður</option>
              <option value="1440">Degi áður</option>
            </select>
          </label>
        </div>
        <label>
          Staðsetning <span className="optional">(valkvætt)</span>
          <input maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <ErrorMessage message={error} />
        <button className="button full" disabled={busy}>
          {busy ? 'Vista…' : 'Vista tíma'}
        </button>
      </form>
    </Modal>
  );
}
