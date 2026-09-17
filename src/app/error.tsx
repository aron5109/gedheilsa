'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-card">
      <h1>Ekki náðist samband.</h1>
      <p>
        Ekki tókst að sækja upplýsingarnar þínar. Vistaðar færslur hafa ekki verið fjarlægðar.
        Reyndu aftur þegar samband er komið á.
      </p>
      <button className="button" onClick={reset}>
        Reyna aftur
      </button>
      <Link href="/">Fara á forsíðu</Link>
    </main>
  );
}
