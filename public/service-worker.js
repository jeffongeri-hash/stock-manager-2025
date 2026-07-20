// Kill-switch (alternate path some users may have registered).
// Do not navigate clients here; forced navigations abort module/chunk loads.
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } finally {
        await self.registration.unregister();
      }
    })()
  )
);
self.addEventListener('fetch', () => {});
