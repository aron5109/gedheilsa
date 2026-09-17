'use client';
import { formatDate } from '@/lib/domain/format';
import { useState, type FormEvent } from 'react';
import {
  UserRound,
  ShieldCheck,
  Bell,
  Download,
  LogOut,
  Plus,
  Mail,
  Check,
  Trash2,
  HeartHandshake,
} from 'lucide-react';
import type { AppData, Profile, Contact, QueuedEntry } from '@/lib/domain/types';
import { INTERESTS } from '@/lib/domain/mood';
import { api, download, setStorageConsent, storageConsent } from '@/lib/client';
import { profilePayload } from './onboarding';
import { Modal, ErrorMessage, HelpCard } from './ui';
export function Settings({
  data,
  demo,
  owner,
  queue,
  emailReady,
  pushReady,
  onChange,
  onShare,
}: {
  data: AppData;
  demo: boolean;
  owner: string;
  queue: QueuedEntry[];
  emailReady: boolean;
  pushReady: boolean;
  onChange: (next: AppData) => void;
  onShare: () => void;
}) {
  const profile = data.profile!;
  const [edit, setEdit] = useState(false),
    [contact, setContact] = useState(false),
    [deletion, setDeletion] = useState(false),
    [confirmation, setConfirmation] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(''),
    [support, setSupport] = useState(profile.support_enabled),
    [days, setDays] = useState(profile.support_days),
    [consent, setConsent] = useState(profile.support_enabled),
    [local, setLocal] = useState(() => (demo ? false : storageConsent(owner)));
  async function saveSupport(e: FormEvent) {
    e.preventDefault();
    setBusy('support');
    setError('');
    try {
      const value = {
        ...profilePayload(profile),
        support_enabled: support,
        support_days: days,
        support_consent: consent,
      };
      const saved = demo
        ? {
            ...profile,
            support_enabled: support,
            support_days: days,
            consent_at: support ? new Date().toISOString() : null,
          }
        : await api<Profile>('/api/profile', 'POST', value);
      onChange({ ...data, profile: saved });
      setMessage('Stuðningsstillingar vistaðar.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function removeContact(c: Contact) {
    if (!confirm(`Fjarlægja ${c.name} sem stuðningsaðila?`)) return;
    setBusy(c.id);
    setError('');
    try {
      if (!demo) await api('/api/contacts', 'DELETE', { id: c.id });
      onChange({ ...data, contacts: data.contacts.filter((x) => x.id !== c.id) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function resend(c: Contact) {
    setBusy(c.id);
    setError('');
    try {
      await api('/api/contacts', 'POST', { id: c.id, name: c.name, email: c.email, consent: true });
      setMessage('Nýtt staðfestingarboð sent.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function exportAll() {
    setBusy('export');
    setError('');
    try {
      const saved = demo
        ? { schema_version: 1, exported_at: new Date().toISOString(), ...data }
        : await api<Record<string, unknown>>('/api/export');
      download(
        'hlyja-oll-gogn.json',
        JSON.stringify({ ...saved, pending_entries: queue }, null, 2),
        'application/json',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function enablePush() {
    setBusy('push');
    setError('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window))
        throw new Error(
          'Þessi vafri styður ekki tilkynningar. Á iPhone þarf að bæta appinu á heimaskjá.',
        );
      const permission = await Notification.requestPermission();
      if (permission !== 'granted')
        throw new Error(
          'Tilkynningar voru ekki leyfðar. Þú getur breytt því í stillingum vafrans.',
        );
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const bytes = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      );
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes }));
      await api('/api/push', 'POST', sub.toJSON());
      setMessage('Tilkynningar hafa verið virkjaðar á þessu tæki.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function disablePush() {
    setBusy('push');
    setError('');
    try {
      const reg = await navigator.serviceWorker?.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api('/api/push', 'DELETE', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setMessage('Tilkynningar hafa verið stöðvaðar á þessu tæki.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function logout() {
    setError('');
    if (queue.length) {
      setError(
        'Það eru enn biðfærslur á tækinu. Sendu þær áður en þú skráir þig út, eða sæktu öll gögn til að varðveita afrit.',
      );
      return;
    }
    setBusy('logout');
    try {
      if (!demo) {
        const reg = await navigator.serviceWorker?.getRegistration('/');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await api('/api/push', 'DELETE', { endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        await api('/auth/logout', 'POST');
      }
      window.location.assign(new URL('/', window.location.origin).href);
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  }
  async function deleteAccount(e: FormEvent) {
    e.preventDefault();
    setBusy('delete');
    setError('');
    try {
      if (queue.length) throw new Error('Sæktu eða sendu biðfærslur áður en reikningnum er eytt.');
      if (!demo) await api('/api/account', 'DELETE', { confirmation });
      window.location.assign(new URL('/', window.location.origin).href);
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
          <span className="eyebrow">ÞÚ RÆÐUR FERÐINNI</span>
          <h1>Þitt rými.</h1>
          <p className="muted">Stilltu Hlýju þannig að hún henti þér.</p>
        </div>
      </div>
      <ErrorMessage message={error} />
      {message && (
        <p className="success-message" role="status">
          <Check size={17} />
          {message}
        </p>
      )}
      <div className="settings-grid">
        <div>
          <section className="card">
            <div className="card-heading">
              <h2>
                <UserRound size={19} />
                Prófíllinn þinn
              </h2>
              <button className="text-button" onClick={() => setEdit(true)}>
                Breyta
              </button>
            </div>
            <div className="profile-summary">
              <span className="avatar large">{profile.name[0]}</span>
              <div>
                <h3>{profile.name}</h3>
                <p className="muted small">
                  {profile.birth_year ? `Fædd/ur ${profile.birth_year} · ` : ''}
                  {profile.timezone}
                </p>
              </div>
            </div>
            <div className="chips">
              {profile.interests.map((i) => (
                <span className="chip soft" key={i}>
                  {i}
                </span>
              ))}
            </div>
            {profile.comfort_activities.length > 0 && (
              <div className="comfort-list">
                <span className="eyebrow">ÞAÐ SEM GERIR ÞÉR GOTT</span>
                {profile.comfort_activities.map((c) => (
                  <p key={c}>{c}</p>
                ))}
              </div>
            )}
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>
                <Bell size={19} />
                Tilkynningar og tækið þitt
              </h2>
            </div>
            <p className="muted small">
              Á læstum skjá birtast almenn skilaboð. Heiti lyfja og upplýsingar um líðan birtast
              aðeins inni í appinu.
            </p>
            {pushReady && !demo ? (
              <div className="button-row">
                <button
                  className="button secondary"
                  disabled={busy === 'push'}
                  onClick={enablePush}
                >
                  Virkja tilkynningar
                </button>
                <button className="text-button" disabled={busy === 'push'} onClick={disablePush}>
                  Stöðva á þessu tæki
                </button>
              </div>
            ) : (
              <p className="status-pill">
                {demo ? 'Óvirkt í sýnishorni' : 'Bíður uppsetningar þjónustu'}
              </p>
            )}
            <hr />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={local}
                onChange={(e) => {
                  try {
                    if (!e.target.checked && queue.length)
                      throw new Error('Sendu biðfærslur áður en þú slekkur á biðgeymslu.');
                    if (!demo) setStorageConsent(owner, e.target.checked);
                    setLocal(e.target.checked);
                  } catch (error) {
                    setError((error as Error).message);
                  }
                }}
              />
              <span>
                Geyma biðfærslur á þessu tæki þegar nettenging rofnar. Eingöngu fyrir eigið tæki.
              </span>
            </label>
            <p className="footnote">
              Vafrinn geymir aðeins ósendar færslur. Ekki hreinsa vafragögn meðan færslur bíða
              sendingar.
            </p>
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>
                <ShieldCheck size={19} />
                Gögnin þín
              </h2>
            </div>
            <div className="settings-actions">
              <button onClick={onShare}>
                <Mail size={18} />
                <span>Deila skapskráningum</span>
                <span>→</span>
              </button>
              <button onClick={exportAll} disabled={busy === 'export'}>
                <Download size={18} />
                <span>Sækja öll gögn (JSON)</span>
                <span>→</span>
              </button>
              <a href="/personuvernd">
                <ShieldCheck size={18} />
                <span>Um persónuvernd og geymslu</span>
                <span>→</span>
              </a>
              <button onClick={logout} disabled={busy === 'logout'}>
                <LogOut size={18} />
                <span>{demo ? 'Yfirgefa sýnishorn' : 'Skrá út'}</span>
                <span>→</span>
              </button>
            </div>
            <button className="danger-link" onClick={() => setDeletion(true)}>
              Eyða reikningi og öllum gögnum
            </button>
          </section>
        </div>
        <div>
          <section className="card">
            <div className="card-heading">
              <h2>
                <HeartHandshake size={20} />
                Fólkið þitt
              </h2>
            </div>
            <p className="muted">
              Stundum hjálpar að einhver heyri í manni. Hér ákveður þú hvort og hvenær Hlýja má
              biðja þitt fólk um að hafa samband.
            </p>
            <div className="contacts-list">
              {data.contacts.map((c) => (
                <div className="contact-row" key={c.id}>
                  <span className="avatar">{c.name[0]}</span>
                  <div>
                    <strong>{c.name}</strong>
                    <span className="small muted">{c.email}</span>
                    <span className={'status-pill ' + (c.verified_at && c.enabled ? 'good' : '')}>
                      {!c.enabled
                        ? 'Afþakkað'
                        : c.verified_at
                          ? 'Staðfestur stuðningsaðili'
                          : 'Bíður staðfestingar'}
                    </span>
                    {!c.verified_at && c.enabled && !demo && (
                      <button
                        className="text-button small"
                        disabled={busy === c.id || !emailReady}
                        onClick={() => resend(c)}
                      >
                        Senda boð aftur
                      </button>
                    )}
                  </div>
                  <button
                    className="icon-button"
                    disabled={busy === c.id}
                    aria-label={`Fjarlægja ${c.name}`}
                    onClick={() => removeContact(c)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="button secondary full" onClick={() => setContact(true)}>
              <Plus size={17} />
              Bæta við stuðningsaðila
            </button>
            <hr />
            <form onSubmit={saveSupport}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={support}
                  onChange={(e) => {
                    setSupport(e.target.checked);
                    if (!e.target.checked) setConsent(false);
                  }}
                />
                <span>
                  <strong>Leyfa sjálfvirka beiðni um samband</strong>
                  <br />
                  Aðeins til aðstandenda sem hafa sjálfir staðfest þátttöku.
                </span>
              </label>
              {support && (
                <>
                  <label>
                    Fjöldi samliggjandi daga
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 3).map((n) => (
                        <option key={n} value={n}>
                          {n} dagar
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="info-box">
                    Beiðni getur farið út ef meðaltal skráðrar líðanar er 2 af 5 eða lægra á hverjum
                    af {days} samliggjandi dögum og nýjasta færslan er einnig 2 eða lægri, innan
                    síðasta sólarhrings. Dagar án skráningar telja ekki. Hámark er ein beiðni á sjö
                    dögum til hvers stuðningsaðila.
                  </p>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Ég samþykki þessa sendingu. Aðstandandi fær nafnið mitt og almenna beiðni um
                      samband, en engar skráningar, lyfjaupplýsingar eða dagbókartexta.
                    </span>
                  </label>
                </>
              )}
              <button className="button full" disabled={busy === 'support'}>
                {busy === 'support' ? 'Vista…' : 'Vista stuðningsstillingar'}
              </button>
            </form>
            <p className="footnote">
              Þetta er regla sem þú velur, ekki læknisfræðileg viðmiðun. Hlýja er ekki
              neyðarþjónusta. Tilkynningar geta tafist eða mistekist.
            </p>
            {data.notifications.length > 0 && (
              <details>
                <summary>Staða síðustu tilkynninga</summary>
                {data.notifications
                  .slice()
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .slice(0, 10)
                  .map((n) => (
                    <p className="small" key={n.id}>
                      {formatDate(n.created_at, profile.timezone, { year: true })} ·{' '}
                      {{ support: 'Stuðningsbeiðni', routine: 'Áminning', appointment: 'Tími' }[
                        n.kind
                      ] ?? 'Tilkynning'}{' '}
                      ·{' '}
                      {{
                        pending: 'Í bið',
                        processing: 'Í vinnslu',
                        sent: 'Afhent þjónustuveitu',
                        failed: 'Sending mistókst',
                        cancelled: 'Hætt við',
                      }[n.status] ?? n.status}
                    </p>
                  ))}
              </details>
            )}
          </section>
          <HelpCard />
        </div>
      </div>
      {edit && (
        <ProfileForm
          profile={profile}
          onClose={() => setEdit(false)}
          onSave={async (value) => {
            const saved = demo
              ? { ...profile, ...value }
              : await api<Profile>('/api/profile', 'POST', value);
            onChange({ ...data, profile: saved as Profile });
            setEdit(false);
          }}
        />
      )}
      {contact && (
        <ContactForm
          demo={demo}
          emailReady={emailReady}
          onClose={() => setContact(false)}
          onSave={async (value) => {
            const saved = await api<Contact>('/api/contacts', 'POST', value);
            onChange({
              ...data,
              contacts: [...data.contacts.filter((c) => c.id !== saved.id), saved],
            });
            setContact(false);
          }}
        />
      )}
      {deletion && (
        <Modal title="Eyða reikningnum þínum?" onClose={() => setDeletion(false)}>
          <form onSubmit={deleteAccount}>
            <p>
              Þessi aðgerð eyðir prófíl, skráningum, áminningum og tengiliðum úr virkri
              gagnageymslu. Hún verður ekki afturkölluð. Afrit sem þú hefur þegar sent öðrum eða
              fært í dagatal verða ekki fjarlægð.
            </p>
            <p className="muted small">
              Gögn geta enn verið í öryggisafritum þjónustuveitunnar þar til varðveislutíma þeirra
              lýkur.
            </p>
            <button type="button" className="button secondary" onClick={exportAll}>
              <Download size={16} />
              Sækja afrit fyrst
            </button>
            <label>
              Skrifaðu EYÐA ÖLLU til að staðfesta
              <input
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </label>
            <ErrorMessage message={error} />
            <button
              className="button danger full"
              disabled={confirmation !== 'EYÐA ÖLLU' || busy === 'delete'}
            >
              Eyða endanlega
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
function ProfileForm({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile;
  onSave: (value: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name),
    [year, setYear] = useState(String(profile.birth_year ?? '')),
    [timezone, setTimezone] = useState(profile.timezone),
    [interests, setInterests] = useState(profile.interests),
    [comfort, setComfort] = useState(profile.comfort_activities.join('\n')),
    [goal, setGoal] = useState(profile.water_goal_ml),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...profilePayload(profile),
        name,
        birth_year: year ? Number(year) : null,
        timezone,
        interests,
        comfort_activities: comfort
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        water_goal_ml: goal,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Prófíllinn þinn" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Nafn
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="form-columns">
          <label>
            Fæðingarár
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear() - 18}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <label>
            Vatnsmarkmið (ml)
            <input
              required
              type="number"
              min="250"
              max="6000"
              step="50"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="small muted">Vatnsmarkmið er þín eigin stilling, ekki læknisráðlegging.</p>
        <label>
          Tímabelti
          <input
            required
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            list="timezones"
          />
          <datalist id="timezones">
            {[
              'Atlantic/Reykjavik',
              'Europe/London',
              'Europe/Copenhagen',
              'Europe/Rome',
              'America/New_York',
            ].map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <fieldset>
          <legend>Áhugamál</legend>
          <div className="chips">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={interests.includes(i)}
                className={'chip ' + (interests.includes(i) ? 'selected' : '')}
                onClick={() =>
                  setInterests(
                    interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i],
                  )
                }
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Það sem gerir þér gott
          <textarea
            rows={4}
            value={comfort}
            maxLength={2000}
            onChange={(e) => setComfort(e.target.value)}
          />
          <span className="small muted">Eitt atriði í hverja línu.</span>
        </label>
        <ErrorMessage message={error} />
        <button className="button full" disabled={busy}>
          {busy ? 'Vista…' : 'Vista breytingar'}
        </button>
      </form>
    </Modal>
  );
}
function ContactForm({
  demo,
  emailReady,
  onSave,
  onClose,
}: {
  demo: boolean;
  emailReady: boolean;
  onSave: (value: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ id, name, email: email.toLowerCase(), consent });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Bæta við stuðningsaðila" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted">
          Hlýja sendir boð sem viðtakandinn þarf að samþykkja áður en tilkynningar geta borist.
        </p>
        <label>
          Nafn
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Netfang
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setConsent(false);
            }}
          />
        </label>
        <label className="checkbox">
          <input
            required
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Ég hef yfirfarið <strong>{email || 'netfangið'}</strong> og heimila að boð með nafni
            mínu verði sent þangað.
          </span>
        </label>
        {(!emailReady || demo) && (
          <p className="info-box">
            {demo ? 'Sýnishornið sendir engin boð.' : 'Tölvupóstþjónusta bíður uppsetningar.'}
          </p>
        )}
        <ErrorMessage message={error} />
        <button className="button full" disabled={!consent || busy || demo || !emailReady}>
          <Mail size={16} />
          {busy ? 'Sendi boð…' : 'Senda staðfestingarboð'}
        </button>
      </form>
    </Modal>
  );
}
