'use client';
import { useState, type FormEvent } from 'react';
import { Download, Mail, Check, ShieldCheck } from 'lucide-react';
import { Modal, ErrorMessage } from './ui';
import { dayKey, addDays, filterMoods } from '@/lib/domain/mood';
import { moodCsv } from '@/lib/domain/export';
import { download, api } from '@/lib/client';
import type { AppData } from '@/lib/domain/types';
export function Share({
  data,
  demo,
  emailReady,
  onClose,
}: {
  data: AppData;
  demo: boolean;
  emailReady: boolean;
  onClose: () => void;
}) {
  const timezone = data.profile?.timezone ?? 'Atlantic/Reykjavik';
  const today = dayKey(new Date(), timezone);
  const [from, setFrom] = useState(addDays(today, -29)),
    [to, setTo] = useState(today),
    [notes, setNotes] = useState(false),
    [email, setEmail] = useState(''),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const selected = filterMoods(data.moods, from, to, timezone);
  function changed() {
    setConsent(false);
    setSent(false);
    setRequestId(crypto.randomUUID());
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (demo) {
      setError('Tölvupóstsendingar eru ekki virkar í sýnishorninu. Þú getur sótt CSV-skrá.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/export', 'POST', {
        from,
        to,
        include_notes: notes,
        email,
        consent,
        request_id: requestId,
      });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Deila líðan á þínum forsendum" onClose={onClose}>
      <p className="muted">
        Veldu tímabil og hvað þú vilt hafa með. Viðtakandi fær aðeins þær skapskráningar sem þú
        velur.
      </p>
      <div className="form-columns">
        <label>
          Frá
          <input
            required
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value);
              changed();
            }}
          />
        </label>
        <label>
          Til
          <input
            required
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => {
              setTo(e.target.value);
              changed();
            }}
          />
        </label>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={notes}
          onChange={(e) => {
            setNotes(e.target.checked);
            changed();
          }}
        />
        <span>Hafa dagbókartexta með. Hann getur innihaldið viðkvæmar upplýsingar.</span>
      </label>
      <div className="export-preview">
        <ShieldCheck size={24} />
        <div>
          <strong>{selected.length} skráningar</strong>
          <p>
            Líðan, orka, tilfinningar og tímastimplar
            {notes ? ' ásamt dagbókartexta.' : '. Dagbókartexti fylgir ekki.'}
          </p>
        </div>
      </div>
      <button
        className="button secondary full"
        disabled={!selected.length || from > to}
        onClick={() =>
          download(`hlyja-${from}-${to}.csv`, moodCsv(selected, notes), 'text/csv;charset=utf-8')
        }
      >
        <Download size={17} />
        Sækja CSV-skrá
      </button>
      <hr />
      <h3>Senda beint í tölvupósti</h3>
      <form onSubmit={send}>
        <label>
          Netfang viðtakanda
          <input
            type="email"
            required
            value={email}
            maxLength={254}
            onChange={(e) => {
              setEmail(e.target.value);
              changed();
            }}
            placeholder="nafn@example.is"
            autoComplete="off"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Ég hef yfirfarið netfangið <strong>{email || 'hér að ofan'}</strong> og samþykki að
            senda þessar {selected.length} skráningar til þess. Ég skil að viðtakandinn getur
            varðveitt og áframsent afritið.
          </span>
        </label>
        {(!emailReady || demo) && (
          <p className="info-box">
            {demo
              ? 'Sýnishornið sendir engan tölvupóst.'
              : 'Tölvupóstþjónusta hefur ekki verið tengd. Þú getur sótt skrána og sent hana sjálf/ur.'}
          </p>
        )}
        <ErrorMessage message={error} />
        {sent ? (
          <p className="success-message" role="status">
            <Check size={18} />
            Sending samþykkt af tölvupóstþjónustu.
          </p>
        ) : (
          <button
            className="button full"
            disabled={busy || !selected.length || !emailReady || demo || !consent}
          >
            <Mail size={17} />
            {busy ? 'Sendi…' : 'Senda valdar skráningar'}
          </button>
        )}
      </form>
    </Modal>
  );
}
