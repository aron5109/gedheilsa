'use client';
import { formatDate, formatNumber } from '@/lib/domain/format';
import Link from 'next/link';
import { useState } from 'react';
import {
  Home,
  ChartNoAxesCombined,
  Bell,
  UserRound,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Leaf,
  Music,
  Heart,
  Droplets,
  Moon,
  Footprints,
  Check,
  CloudUpload,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AppData, MoodScore, WellbeingEntry, Profile } from '@/lib/domain/types';
import { MOODS, dayKey, addDays, suggestions } from '@/lib/domain/mood';
import { api, setStorageConsent } from '@/lib/client';
import { useHlyja } from './use-hlyja';
import { Brand, Face, HelpCard, Modal } from './ui';
import { MoodForm, WellbeingForm } from './entry-forms';
import { MoodChart, History } from './history';
import { Reminders } from './reminders';
import { Settings } from './settings';
import { Share } from './share';
import { Onboarding } from './onboarding';
type Page = 'today' | 'history' | 'reminders' | 'settings';
const navigation = [
  { id: 'today' as const, label: 'Dagurinn minn', short: 'Í dag', icon: Home },
  { id: 'history' as const, label: 'Líðan yfir tíma', short: 'Líðan', icon: ChartNoAxesCombined },
  { id: 'reminders' as const, label: 'Áminningar', short: 'Áminningar', icon: Bell },
  { id: 'settings' as const, label: 'Mitt rými', short: 'Mitt rými', icon: UserRound },
];
export function AppShell({
  initialData,
  owner,
  demo = false,
  emailReady = false,
  pushReady = false,
}: {
  initialData: AppData;
  owner: string;
  demo?: boolean;
  emailReady?: boolean;
  pushReady?: boolean;
}) {
  const { data, setData, queue, syncing, syncError, online, saveEntry, sync } = useHlyja(
    initialData,
    owner,
    demo,
  );
  const [page, setPage] = useState<Page>('today'),
    [mood, setMood] = useState<{ score?: MoodScore } | null>(null),
    [wellbeing, setWellbeing] = useState<WellbeingEntry['kind'] | null>(null),
    [share, setShare] = useState(false),
    [activity, setActivity] = useState<{ title: string; description: string } | null>(null);
  const profile = data.profile;
  if (!profile)
    return (
      <Onboarding
        demo={demo}
        onSave={async (value, local) => {
          const saved = demo
            ? ({
                ...value,
                id: owner,
                health_consent_at: new Date().toISOString(),
                consent_at: null,
              } as unknown as Profile)
            : await api<Profile>('/api/profile', 'POST', value);
          if (!demo) setStorageConsent(owner, local);
          setData({ ...data, profile: saved });
        }}
      />
    );
  const timezone = profile.timezone;
  const today = dayKey(new Date(), timezone);
  const todaysMoods = data.moods.filter((m) => dayKey(m.occurred_at, timezone) === today);
  const sorted = data.moods.slice().sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const latest = sorted[0];
  const daily = data.wellbeing.filter((w) => dayKey(w.occurred_at, timezone) === today);
  const water = daily.filter((w) => w.kind === 'water').reduce((s, w) => s + w.value, 0);
  const sleep = daily
    .filter((w) => w.kind === 'sleep')
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0]?.value;
  const movement = daily.filter((w) => w.kind === 'movement').reduce((s, w) => s + w.value, 0);
  const steps = daily.filter((w) => w.kind === 'steps').reduce((s, w) => s + w.value, 0);
  const ideas = suggestions(profile, latest?.score);
  const week = addDays(today, -6);
  const weekEntries = data.moods.filter(
    (m) => dayKey(m.occurred_at, timezone) >= week && dayKey(m.occurred_at, timezone) <= today,
  );
  const average = weekEntries.length
    ? weekEntries.reduce((s, m) => s + m.score, 0) / weekEntries.length
    : undefined;
  const todayRoutine = data.routines.find((r) => r.enabled);
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Beint í efni
      </a>
      <aside className="sidebar">
        <a href={demo ? '/demo' : '/app'} className="sidebar-brand">
          <Brand />
        </a>
        <p className="sidebar-tagline">Líðan í þínum takti.</p>
        <nav aria-label="Aðalvalmynd">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={'nav-item ' + (page === n.id ? 'active' : '')}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={20} strokeWidth={1.7} />
              <span>{n.label}</span>
              {page === n.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-heart">
            <Heart size={19} />
          </span>
          <p>
            Þú þarft ekki að hafa
            <br />
            allt á hreinu í dag.
          </p>
          <span>Eitt lítið skref í einu.</span>
        </div>
        <div className="sidebar-bottom">
          <a href="/personuvernd">
            <ShieldCheck size={15} />
            Þín gögn. Þín ákvörðun.
          </a>
          <button onClick={() => navigate('settings')}>
            <span className="avatar">{profile.name[0]}</span>
            <span>
              <strong>{profile.name}</strong>
              <small>Mitt rými</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand small />
          </div>
          <div className="breadcrumb">
            Mitt rými <span>/</span>
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className={'sync-state ' + (queue.length ? 'pending' : '')} role="status">
              {demo ? (
                <>
                  <span className="demo-dot" />
                  Sýnishorn
                </>
              ) : !online ? (
                <>
                  <WifiOff size={14} />
                  Án nettengingar
                </>
              ) : syncing ? (
                <>
                  <RefreshCw size={14} />
                  Samstilli
                </>
              ) : queue.length ? (
                <>
                  <CloudUpload size={14} />
                  {queue.length} í bið
                </>
              ) : (
                <>
                  <Check size={14} />
                  Vistað á vefþjóni
                </>
              )}
            </span>
            <button
              className="topbar-avatar avatar"
              onClick={() => navigate('settings')}
              aria-label="Opna prófíl"
            >
              {profile.name[0]}
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <Sparkles size={15} />
                <strong>Sýnishorn</strong> · Tilbúnar færslur. Breytingar hverfa þegar síðan er
                endurhlaðin.
              </span>
              <Link href="/">
                Um Hlýju <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          {(queue.length > 0 || syncError) && (
            <div className="queue-banner" role="status">
              <CloudUpload size={18} />
              <span>
                {queue.length} {queue.length === 1 ? 'færsla bíður' : 'færslur bíða'} sendingar á
                þessu tæki.{syncError ? ' ' + syncError : ''} Ekki hreinsa vafragögn meðan færslur
                bíða.
              </span>
              <button className="text-button" disabled={syncing} onClick={() => void sync()}>
                Reyna aftur
              </button>
            </div>
          )}
          {page === 'today' && (
            <>
              <div className="section-heading dashboard-heading">
                <div>
                  <span className="eyebrow">ÞETTA ER ÞINN DAGUR</span>
                  <h1>Gott að sjá þig, {profile.name}.</h1>
                  <p className="muted">Gefðu þér augnablik. Hvernig hefurðu það?</p>
                </div>
                <span className="date-label">
                  {formatDate(new Date(), timezone, { weekday: true })}
                </span>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-primary">
                  <section className="card mood-card">
                    <div className="card-heading">
                      <span className="eyebrow">STÖLDRAÐU AÐEINS VIÐ</span>
                      <span className="small muted">
                        {todaysMoods.length
                          ? `${todaysMoods.length} skráningar í dag`
                          : 'Þín stund'}
                      </span>
                    </div>
                    <h2>Hvernig líður þér núna?</h2>
                    <p className="muted">Það er ekkert rétt eða rangt svar.</p>
                    <div className="mood-options dashboard-moods">
                      {MOODS.map((m) => (
                        <button
                          className="mood-option"
                          key={m.score}
                          onClick={() => setMood({ score: m.score })}
                        >
                          <Face score={m.score} size={60} />
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mood-card-footer">
                      <span>
                        <ShieldCheck size={14} />
                        Bara fyrir þig
                      </span>
                      <button className="text-button" onClick={() => setMood({})}>
                        Skrá líðan <Plus size={16} />
                      </button>
                    </div>
                  </section>
                  <section className="card weekly-card">
                    <div className="card-heading">
                      <div>
                        <h2>Líðan síðustu daga</h2>
                        <p className="muted small">
                          Síðustu sjö dagar · {weekEntries.length} skráningar
                        </p>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Skoða allar skapskráningar"
                        onClick={() => navigate('history')}
                      >
                        <ArrowUpRight size={21} />
                      </button>
                    </div>
                    <div className="weekly-value">
                      {average ? (
                        <>
                          <Face score={Math.round(average)} size={36} />
                          <strong>{formatNumber(average)}</strong>
                          <span className="muted small">af 5 að meðaltali</span>
                        </>
                      ) : (
                        <p className="muted">Fyrsta skráningin þín byrjar yfirlitið.</p>
                      )}
                    </div>
                    <MoodChart
                      entries={data.moods}
                      from={week}
                      to={today}
                      timezone={timezone}
                      compact
                    />
                    <div className="chart-footer">
                      <span>
                        <i />
                        Meðaltal skráðrar líðanar
                      </span>
                      <button className="text-button" onClick={() => navigate('history')}>
                        Skoða nánar <ChevronRight size={15} />
                      </button>
                    </div>
                  </section>
                </div>
                <div className="dashboard-secondary">
                  <section className="gentle-card">
                    <div className="gentle-art" aria-hidden="true">
                      <svg viewBox="0 0 180 150">
                        <circle cx="105" cy="70" r="48" fill="#e8e2c2" />
                        <path
                          d="M82 145C80 99 91 68 113 40"
                          stroke="#526e4c"
                          strokeWidth="3"
                          fill="none"
                        />
                        <path d="M93 98C56 103 52 78 55 68C76 64 95 76 93 98Z" fill="#8f9f79" />
                        <path
                          d="M100 78C135 84 147 60 144 49C121 45 103 59 100 78Z"
                          fill="#657e60"
                        />
                        <path d="M111 52C91 40 96 20 106 13C122 23 124 39 111 52Z" fill="#a7b291" />
                        <path
                          d="M84 125C112 137 134 120 135 109C114 97 91 107 84 125Z"
                          fill="#a4b293"
                        />
                      </svg>
                    </div>
                    <span className="eyebrow">LÍTIL ÁMINNING</span>
                    <h2>
                      Þú mátt taka
                      <br />
                      þetta rólega.
                    </h2>
                    <p>
                      Sumir dagar þurfa meiri mýkt.
                      <br />
                      Það er líka hluti af því að hlúa að sér.
                    </p>
                    <button
                      className="gentle-link"
                      onClick={() =>
                        setActivity({
                          title: 'Ein róleg mínúta',
                          description:
                            'Komdu þér vel fyrir. Finndu stuðninginn undir fótunum og leyfðu önduninni að vera róleg og eðlileg. Þú þarft ekkert að gera fullkomlega.',
                        })
                      }
                    >
                      Gefðu þér smá stund <ArrowUpRight size={16} />
                    </button>
                  </section>
                  <section className="card daily-reminder">
                    <div className="card-heading">
                      <h2>
                        <Bell size={18} />
                        Áminningar þínar
                      </h2>
                      <button
                        className="icon-button"
                        aria-label="Skoða áminningar"
                        onClick={() => navigate('reminders')}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                    {todayRoutine ? (
                      <div className="next-routine">
                        <span className="tile-icon lavender">
                          <Bell size={21} />
                        </span>
                        <div>
                          <strong>{todayRoutine.title}</strong>
                          <p className="muted small">Daglega · {todayRoutine.times.join(' og ')}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="muted small">Smá hjálp við að muna það sem skiptir þig máli.</p>
                    )}
                    <button className="text-button" onClick={() => navigate('reminders')}>
                      {todayRoutine ? 'Skoða daginn' : 'Setja upp áminningu'}
                      <ChevronRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
              <div className="subsection-heading">
                <div>
                  <h2>Litlu hlutirnir telja.</h2>
                  <p className="muted small">Hlúðu að þér, á þínum forsendum.</p>
                </div>
                <button className="text-button" onClick={() => setWellbeing('steps')}>
                  Skrá skref <Plus size={14} />
                </button>
              </div>
              <div className="wellbeing-grid">
                <button
                  className="card wellbeing-card water-card"
                  onClick={() => setWellbeing('water')}
                >
                  <span className="wellbeing-label">
                    <span className="tile-icon blue">
                      <Droplets size={20} />
                    </span>
                    Vatn
                    <Plus size={17} />
                  </span>
                  <strong>
                    {formatNumber(water, 0)}
                    <small> ml</small>
                  </strong>
                  <span className="muted small">
                    af þínu {formatNumber(profile.water_goal_ml, 0)} ml markmiði
                  </span>
                  <div className="water-progress" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span
                        className={
                          i < Math.floor((water / profile.water_goal_ml) * 8) ? 'filled' : ''
                        }
                        key={i}
                      />
                    ))}
                  </div>
                </button>
                <button className="card wellbeing-card" onClick={() => setWellbeing('sleep')}>
                  <span className="wellbeing-label">
                    <span className="tile-icon lavender">
                      <Moon size={20} />
                    </span>
                    Svefn
                    <Plus size={17} />
                  </span>
                  <strong>
                    {sleep !== undefined ? formatNumber(sleep) : '—'}
                    <small> klst.</small>
                  </strong>
                  <span className="muted small">
                    {sleep !== undefined
                      ? 'Síðast skráði svefn dagsins'
                      : 'Hvernig svafstu síðustu nótt?'}
                  </span>
                  <div className="sleep-wave" aria-hidden="true">
                    <svg viewBox="0 0 230 30">
                      <path
                        d="M0 20C15 20 14 7 29 7S40 25 55 25 67 10 82 10 99 21 114 21 126 2 145 2 167 17 185 17 210 10 230 10"
                        fill="none"
                        stroke="#9d96bb"
                        strokeWidth="2.4"
                      />
                    </svg>
                  </div>
                </button>
                <button className="card wellbeing-card" onClick={() => setWellbeing('movement')}>
                  <span className="wellbeing-label">
                    <span className="tile-icon peach">
                      <Footprints size={20} />
                    </span>
                    Hreyfing
                    <Plus size={17} />
                  </span>
                  <strong>
                    {movement}
                    <small> mín.</small>
                  </strong>
                  <span className="muted small">
                    {steps ? `${formatNumber(steps, 0)} skref skráð` : 'Smá hreyfing á þínum hraða'}
                  </span>
                  <div className="movement-caption">
                    <Leaf size={14} />
                    Hvert lítið skref hefur sitt gildi.
                  </div>
                </button>
              </div>
              <div className="subsection-heading">
                <div>
                  <h2>Eitthvað sem gæti gert þér gott.</h2>
                  <p className="muted small">Hugmyndir út frá því sem þú hefur sagt okkur.</p>
                </div>
                <span className="personalized-label">
                  <Sparkles size={14} />
                  Fyrir þig
                </span>
              </div>
              <div className="suggestion-grid">
                {ideas.map((idea, i) => (
                  <button
                    key={idea.title}
                    className="suggestion-card"
                    onClick={() => setActivity(idea)}
                  >
                    <span className={'tile-icon ' + ['sage', 'peach', 'lavender'][i]}>
                      {i === 0 ? (
                        <Music size={21} />
                      ) : i === 1 ? (
                        <Leaf size={21} />
                      ) : (
                        <Heart size={21} />
                      )}
                    </span>
                    <span className="suggestion-time">{idea.time}</span>
                    <h3>{idea.title}</h3>
                    <p>{idea.description}</p>
                    <span className="suggestion-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </button>
                ))}
              </div>
              {latest?.score === 1 && <HelpCard />}
              <footer className="dashboard-footer">
                <Heart size={13} />
                Þú þarft ekki að gera allt. Eitt lítið skref má vera nóg.
              </footer>
            </>
          )}
          {page === 'history' && (
            <History
              entries={data.moods}
              timezone={timezone}
              pendingIds={queue.map((q) => q.id)}
              onShare={() => setShare(true)}
            />
          )}{' '}
          {page === 'reminders' && (
            <Reminders data={data} demo={demo} onChange={setData} pushReady={pushReady} />
          )}{' '}
          {page === 'settings' && (
            <Settings
              data={data}
              demo={demo}
              owner={owner}
              queue={queue}
              emailReady={emailReady}
              pushReady={pushReady}
              onChange={setData}
              onShare={() => setShare(true)}
            />
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Valmynd í síma">
        {navigation.map((n) => (
          <button
            key={n.id}
            className={page === n.id ? 'active' : ''}
            aria-current={page === n.id ? 'page' : undefined}
            onClick={() => navigate(n.id)}
          >
            <n.icon size={21} />
            <span>{n.short}</span>
          </button>
        ))}
      </nav>
      {mood && (
        <MoodForm
          initialScore={mood.score}
          onClose={() => setMood(null)}
          onSave={(entry) => saveEntry('mood', entry)}
        />
      )}{' '}
      {wellbeing && (
        <WellbeingForm
          kind={wellbeing}
          onClose={() => setWellbeing(null)}
          onSave={(entry) => saveEntry('wellbeing', entry)}
        />
      )}{' '}
      {share && (
        <Share data={data} demo={demo} emailReady={emailReady} onClose={() => setShare(false)} />
      )}{' '}
      {activity && (
        <Modal title={activity.title} onClose={() => setActivity(null)}>
          <div className="activity-content">
            <div className="breathing-orb">
              <Heart size={38} strokeWidth={1} />
            </div>
            <p>{activity.description}</p>
            <p className="muted small">
              Prófaðu ef það hentar þér. Þú mátt alltaf hætta eða velja eitthvað annað.
            </p>
            <button
              className="button full"
              onClick={() => {
                setActivity(null);
                setMood({});
              }}
            >
              Hvernig líður mér núna?
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
