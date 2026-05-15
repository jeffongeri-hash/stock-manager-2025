import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'

// One-time cache buster: when APP_VERSION changes, unregister stale service
// workers and purge all caches so users on the old shell get the new build.
const APP_VERSION = 'v2026-05-15-landing';
(async () => {
  try {
    const stored = localStorage.getItem('pp_app_version');
    if (stored !== APP_VERSION) {
      localStorage.setItem('pp_app_version', APP_VERSION);
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        const hadController = !!navigator.serviceWorker.controller;
        if (regs.length) {
          await Promise.all(regs.map((r) => r.unregister()));
        }
        // If an old SW was controlling this page, force a hard reload that
        // bypasses it. Append a cache-bust param so the HTML is re-fetched
        // from the network, not from the SW's runtime cache.
        if (stored !== null && (regs.length || hadController)) {
          const url = new URL(window.location.href);
          url.searchParams.set('_v', APP_VERSION);
          window.location.replace(url.toString());
          return;
        }
      }
    }
  } catch (e) {
    // best-effort, never block boot
    console.warn('cache-buster failed', e);
  }

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  );
})();
