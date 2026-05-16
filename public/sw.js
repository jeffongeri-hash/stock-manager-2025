// Kill-switch service worker. Replaces the previous PWA service worker so
// returning users get the new build instead of a stale cached shell.
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await Promise.all(
          clients.map((c) => {
            try {
              const url = new URL(c.url);
              url.searchParams.set('sw-cleanup', Date.now().toString());
              return c.navigate(url.toString());
            } catch (_) {
              return Promise.resolve();
            }
          })
        );
        await self.registration.unregister();
      } catch (_) {
        // best-effort cleanup
      }
    })()
  )
);
// Pass-through fetch — never serve from cache.
self.addEventListener('fetch', () => {});
