// No authenticated HTML, API responses, or health data are cached by this worker.
const reminderUrls = [
  '/app',
  '/app?skra=lidan',
  '/app?skra=vatn',
  '/app?skra=svefn',
  '/app?sida=aminningar',
];
const safeUrl = (value) => (reminderUrls.includes(value) ? value : '/app');
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
self.addEventListener('push', (event) => {
  let data = {};
  try {
    const value = event.data?.json();
    if (value && typeof value === 'object') data = value;
  } catch {
    /* Use a discreet fallback when the payload is invalid. */
  }
  event.waitUntil(
    self.registration.showNotification('Hlýja', {
      body:
        typeof data.body === 'string' && data.body.trim()
          ? data.body.slice(0, 240)
          : 'Þín stund í Hlýju. Opnaðu appið þegar það hentar þér.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: typeof data.tag === 'string' ? data.tag.slice(0, 80) : 'hlyja',
      data: { url: safeUrl(data.url) },
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(safeUrl(event.notification.data?.url), self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Reuse an exact destination; never reload a different tab and discard its unfinished form.
      const page = list.find((c) => c.url === target);
      return page ? page.focus() : clients.openWindow(target);
    }),
  );
});
