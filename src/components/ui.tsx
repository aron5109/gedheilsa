'use client';
import { useEffect, useRef, type ReactNode } from 'react';
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
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className={'modal ' + (wide ? 'modal-wide' : '')}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Loka glugga" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      {children}
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
