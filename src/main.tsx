import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'

// Force-replace any previously installed vite-plugin-pwa service worker
// with the kill-switch worker at /sw.js. That worker clears all caches,
// navigates open clients to a cache-busted URL, then unregisters itself.
// One-time hard reload guard ensures the cleanup runs exactly once.
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  );
})();
