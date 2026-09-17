import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Hlýja — líðan í þínum takti', template: '%s · Hlýja' },
  description: 'Þitt rými fyrir líðan, litlu skrefin og það sem gerir þér gott.',
  icons: { icon: '/icon.svg' },
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Hlýja', statusBarStyle: 'default' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#315d50' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body>{children}</body>
    </html>
  );
}
