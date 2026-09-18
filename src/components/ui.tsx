'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X, Heart, ArrowUpRight } from 'lucide-react';
import { MOODS } from '@/lib/domain/mood';
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={'brand ' + (small ? 'brand-small' : '')}>
      <span className="brand-mark">
        <Heart size={small ? 20 : 24} strokeWidth={1.7} />
      </span>
      Hlýja<span className="brand-dot">.</span>
    </span>
  );
}
export function Face({ score, size = 48 }: { score: number; size?: number }) {
  const mood = MOODS[Math.max(0, Math.min(4, Math.round(score) - 1))];
  const mouths = [
    'M 15 36 Q 25 24 35 36',
    'M 16 34 Q 25 27 34 34',
    'M 16 32 Q 25 34 34 32',
    'M 15 29 Q 25 40 35 29',
    'M 14 28 Q 25 44 36 28 Z',
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <circle cx="25" cy="25" r="24" fill={mood.soft} />
      <circle cx="18" cy="20" r="2" fill={mood.color} />
      <circle cx="32" cy="20" r="2" fill={mood.color} />
      <path
        d={mouths[mood.score - 1]}
        stroke={mood.color}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill={mood.score === 5 ? mood.color : 'none'}
      />
    </svg>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  dirty = false,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  dirty?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [confirmClose, setConfirmClose] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (confirmClose) continueRef.current?.focus();
  }, [confirmClose]);
  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [dirty]);
  function requestClose() {
    if (busy) return;
    if (!dirty) return onClose();
    fieldRef.current = document.activeElement as HTMLElement | null;
    setConfirmClose(true);
  }
  function continueEditing() {
    setConfirmClose(false);
    requestAnimationFrame(() => fieldRef.current?.focus());
  }
  return (
    <dialog
      className={'modal ' + (wide ? 'modal-wide' : '')}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (confirmClose) continueEditing();
        else requestClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-head">
        <h2 id={titleId}>{confirmClose ? 'Loka án þess að vista?' : title}</h2>
        <button
          className="icon-button"
          aria-label="Loka glugga"
          disabled={busy}
          onClick={requestClose}
        >
          <X size={22} />
        </button>
      </div>
      <div hidden={confirmClose}>{children}</div>
      {confirmClose && (
        <div className="discard-confirmation">
          <p>
            Það sem þú hefur skrifað eða breytt hefur ekki verið vistað. Þú getur haldið áfram eða
            lokað án þess að vista.
          </p>
          <div className="button-row">
            <button className="button" ref={continueRef} onClick={continueEditing}>
              Halda áfram
            </button>
            <button className="text-button" onClick={onClose}>
              Loka án þess að vista
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null;
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <Heart size={26} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function HelpCard({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={'help-card ' + (compact ? 'compact' : '')}>
      <span className="eyebrow">ÞAÐ ER HJÁLP AÐ FÁ</span>
      <h3>Það er í lagi að biðja um hjálp.</h3>
      <p>
        Ef þér líður mjög illa geturðu talað við einhvern sem þú treystir eða hringt í 1717. Í
        bráðri hættu skaltu hringja í 112.
      </p>
      <div className="help-links">
        <a href="tel:1717">
          Hjálparsíminn 1717 <ArrowUpRight size={15} />
        </a>
        <a href="tel:112">
          Neyðarnúmer 112 <ArrowUpRight size={15} />
        </a>
      </div>
    </aside>
  );
}
