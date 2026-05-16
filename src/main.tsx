import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'

// ---------------------------------------------------------------------------
// Service-worker cleanup
// ---------------------------------------------------------------------------
// Previous builds shipped a vite-plugin-pwa service worker that aggressively
// cached the HTML shell and kept serving the old homepage to returning users.
// We now ship a kill-switch SW at /sw.js (and /service-worker.js) that purges
// caches, navigates open clients to a fresh URL, and unregisters itself.
//
// For any client that still has the OLD SW controlling it, we also clear all
// caches here and force a one-time hard reload so the new HTML is fetched
// from the network instead of the stale runtime cache.
// ---------------------------------------------------------------------------
const APP_VERSION = 'v2026-05-16-killswitch';

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com'));

(async () => {
  try {
    if ('serviceWorker' in navigator) {
      // In iframe / Lovable preview: never keep a SW around.
      if (isInIframe || isPreviewHost) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } else {
        const stored = localStorage.getItem('pp_app_version');
        const hadController = !!navigator.serviceWorker.controller;

        if (stored !== APP_VERSION) {
          localStorage.setItem('pp_app_version', APP_VERSION);

          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }

          // Register the kill-switch SW so it takes over from the old one,
          // purges its caches, and unregisters itself on activation.
          try {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          } catch {/* ignore */}

          // If an old SW was actually controlling this page, force a
          // network-fresh reload so the user lands on the new homepage.
          if (stored !== null && hadController) {
            const url = new URL(window.location.href);
            url.searchParams.set('_v', APP_VERSION);
            window.location.replace(url.toString());
            return;
          }
        }
      }
    }
  } catch (e) {
    console.warn('sw cleanup failed', e);
  }

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  );
})();
