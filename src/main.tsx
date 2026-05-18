import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'

// Force-replace any previously installed vite-plugin-pwa service worker
// with the kill-switch worker at /sw.js. That worker clears all caches,
// navigates open clients to a cache-busted URL, then unregisters itself.
// One-time hard reload guard ensures the cleanup runs exactly once.
// Recover from stale lazy-chunk references left over from a previous deploy.
// When the browser has a cached index.html that points to a JS chunk that no
// longer exists, dynamic import() throws "Importing a module script failed"
// and the app renders a blank screen. Detect that once, wipe caches, and
// hard-reload bypassing the SW.
function handleChunkLoadFailure(reason: unknown) {
  const msg = String((reason as any)?.message || reason || '');
  if (!/Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(msg)) {
    return;
  }
  // Cooldown: avoid reload loops, but allow recovery from new stale chunks later in session.
  const last = Number(sessionStorage.getItem('pp_chunk_reloaded_at') || '0');
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem('pp_chunk_reloaded_at', String(Date.now()));
  (async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set('chunk-reload', Date.now().toString());
      window.location.replace(url.toString());
    }
  })();
}
window.addEventListener('error', (e) => handleChunkLoadFailure(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => handleChunkLoadFailure(e.reason));

(async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const hadOldSw = regs.some((r) => {
        const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
        return !!url && !/\/sw\.js(\?|$)/.test(url);
      });

      // Always (re)register the kill-switch worker.
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {}

      // If an old PWA worker was present and we haven't already cleaned up,
      // wipe caches and force a hard reload that bypasses the SW cache.
      const cleaned = sessionStorage.getItem('pp_sw_cleaned');
      if (hadOldSw && !cleaned) {
        sessionStorage.setItem('pp_sw_cleaned', '1');
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        const url = new URL(window.location.href);
        url.searchParams.set('sw-cleanup', Date.now().toString());
        window.location.replace(url.toString());
        return;
      }
    }
  } catch (e) {
    console.warn('sw cleanup failed', e);
  }

  createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  );
  // App mounted successfully — clear chunk-reload cooldown so future stale chunks can recover.
  sessionStorage.removeItem('pp_chunk_reloaded_at');
})();
