// Kill-switch service worker.
// Replaces any previous vite-plugin-pwa service worker. It unregisters
// itself, deletes all caches, and force-navigates open clients to a
// cache-busted URL so users stuck on the old cached shell get the new
// landing page on their very next load.
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));

self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        await Promise.all(
          clients.map((c) => {
            const url = new URL(c.url);
            url.searchParams.set('sw-cleanup', Date.now().toString());
            return c.navigate(url.toString()).catch(() => {});
          })
        );
      } finally {
        await self.registration.unregister();
      }
    })()
  )
);

// Pass-through fetch: never serve from cache.
self.addEventListener('fetch', () => {});
