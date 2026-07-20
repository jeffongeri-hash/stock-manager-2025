// Kill-switch service worker.
// Replaces any previous vite-plugin-pwa service worker. It unregisters
// itself and deletes all caches without force-navigating open pages.
// Forced client navigation was aborting lazy-loaded homepage chunks and
// causing intermittent blank screens/glitches on first load.
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

// Pass-through fetch: never serve from cache.
self.addEventListener('fetch', () => {});
