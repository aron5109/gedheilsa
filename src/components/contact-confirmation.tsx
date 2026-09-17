'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Brand, ErrorMessage } from './ui';
import { api } from '@/lib/client';
export function ContactConfirmation({
  token,
  action,
}: {
  token: string;
  action: 'verify' | 'revoke';
}) {
  const [done, setDone] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await api('/api/contact-token', 'POST', { token, action });
      setDone(true);
      window.history.replaceState(null, '', '/stadfesta');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="standalone-card">
      <Brand />
      <h1>
        {done
          ? action === 'verify'
            ? 'Takk fyrir að vera til staðar.'
            : 'Tilkynningum hefur verið hætt.'
          : action === 'verify'
            ? 'Viltu vera stuðningsaðili?'
            : 'Hætta að fá stuðningsbeiðnir?'}
      </h1>
      {!done && (
        <>
          <p>
            {action === 'verify'
              ? 'Með samþykki gætir þú fengið almenna beiðni um að hafa samband við þann sem bauð þér. Þú færð ekki skráningar um líðan eða lyf.'
              : 'Þú færð ekki fleiri sjálfvirkar stuðningsbeiðnir vegna þessarar tengingar.'}
          </p>
          <p className="muted">
            Hlýja er ekki neyðarþjónusta. Þátttaka felur ekki í sér ábyrgð á eftirliti eða öryggi
            viðkomandi.
          </p>
          <ErrorMessage message={error} />
          <button
            className="button full"
            disabled={busy || !/^[a-f0-9]{64}$/.test(token)}
            onClick={confirm}
          >
            {busy
              ? 'Staðfesti…'
              : action === 'verify'
                ? 'Já, ég samþykki þátttöku'
                : 'Stöðva tilkynningar'}
          </button>
        </>
      )}
      {done && <Link href="/">Fara á forsíðu</Link>}
    </main>
  );
}
