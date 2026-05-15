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
        if (regs.length) {
          await Promise.all(regs.map((r) => r.unregister()));
          // Reload once so the next load fetches fresh HTML and registers the
          // new service worker cleanly.
          if (stored !== null) {
            window.location.reload();
            return;
          }
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
