'use client';
import { useCallback, useSyncExternalStore } from 'react';

export type AppPage = 'today' | 'history' | 'reminders' | 'settings';
const fragments: Record<AppPage, string> = {
  today: 'i-dag',
  history: 'lidan',
  reminders: 'aminningar',
  settings: 'mitt-rymi',
};
const eventName = 'hlyja:navigation';
function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(eventName, onChange);
  };
}

// Only a screen identifier enters the URL. Entries and notes stay out of browser history.
export function useAppNavigation(initialPage: AppPage) {
  const getSnapshot = useCallback(
    () =>
      (Object.entries(fragments).find(
        ([, fragment]) => window.location.hash === `#${fragment}`,
      )?.[0] as AppPage | undefined) ?? initialPage,
    [initialPage],
  );
  const getServerSnapshot = useCallback(() => initialPage, [initialPage]);
  const page = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const navigate = useCallback((next: AppPage) => {
    const url = new URL(window.location.href);
    if (url.hash === `#${fragments[next]}`) return;
    url.hash = fragments[next];
    // Preserve Next's own history fields when adding an app screen.
    window.history.pushState(window.history.state, '', url);
    window.dispatchEvent(new Event(eventName));
  }, []);
  return { page, navigate };
}
