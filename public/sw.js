// No authenticated HTML, API responses, or health data are cached by this worker.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    /* Generic reminder only. */
  }
  event.waitUntil(
    self.registration.showNotification('Stund fyrir þig', {
      body: 'Þú átt áminningu í Hlýju.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: typeof data.tag === 'string' ? data.tag : 'hlyja',
      data: { url: '/app' },
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const page = list.find((c) => new URL(c.url).origin === self.location.origin);
      return page ? page.focus() : clients.openWindow('/app');
    }),
  );
});
