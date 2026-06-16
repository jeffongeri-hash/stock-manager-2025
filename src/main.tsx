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
// Recover from stale lazy-chunk references at most ONCE per browser session.
// Previously this fired on every chunk error with only a 10s cooldown, which
// caused repeated window.location.replace() calls and a visible flicker/loop
// in the preview whenever an asset request was intercepted (e.g. auth bridge
// 302 on the Lovable preview iframe). Now: try once, then give up silently.
// Capture EVERY failed dynamic import / script-load event with full diagnostics
// so we can see which chunk URL is failing, whether the response was an auth
// redirect (302 → HTML), and the surrounding navigation context. Logs are
// emitted to the console with the `[chunk-debug]` tag.
async function probeChunkUrl(url: string) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', credentials: 'include' });
    const ct = res.headers.get('content-type') || '';
    const loc = res.headers.get('location') || '';
    const bodySnippet = ct.includes('text/html') || ct.includes('application/json')
      ? (await res.clone().text()).slice(0, 240)
      : '';
    return { status: res.status, type: res.type, contentType: ct, location: loc, bodySnippet };
  } catch (err) {
    return { status: 'fetch-threw', error: String((err as any)?.message || err) };
  }
}

function extractChunkUrl(msg: string, reason: any): string | null {
  // Vite/browser error messages often include the failing URL.
  const m = msg.match(/https?:\/\/[^\s"')]+\.m?js[^\s"')]*/);
  if (m) return m[0];
  if (reason?.target?.src) return String(reason.target.src);
  return null;
}

function handleChunkLoadFailure(source: 'error' | 'unhandledrejection', reason: unknown) {
  const err: any = reason;
  const msg = String(err?.message || err || '');
  const isChunkErr = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk \d+ failed|ChunkLoadError/i.test(msg);

  if (!isChunkErr) return;

  const chunkUrl = extractChunkUrl(msg, err);
  const diag = {
    source,
    message: msg,
    name: err?.name,
    stack: typeof err?.stack === 'string' ? err.stack.split('\n').slice(0, 8).join('\n') : undefined,
    chunkUrl,
    currentUrl: window.location.href,
    referrer: document.referrer,
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
    reloadedThisSession: sessionStorage.getItem('pp_chunk_reloaded_once') === '1',
  };
  // eslint-disable-next-line no-console
  console.error('[chunk-debug] dynamic import failed', diag);

  if (chunkUrl) {
    probeChunkUrl(chunkUrl).then((probe) => {
      // eslint-disable-next-line no-console
      console.error('[chunk-debug] probe result for', chunkUrl, probe);
    });
  }

  if (sessionStorage.getItem('pp_chunk_reloaded_once') === '1') {
    // eslint-disable-next-line no-console
    console.warn('[chunk-debug] already attempted recovery this session — not reloading again');
    return;
  }
  sessionStorage.setItem('pp_chunk_reloaded_once', '1');
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
      // eslint-disable-next-line no-console
      console.warn('[chunk-debug] reloading once to recover →', url.toString());
      window.location.replace(url.toString());
    }
  })();
}

window.addEventListener('error', (e) => {
  // Also catch <script> load failures, which fire as ErrorEvent with target set.
  if ((e as any).target && (e as any).target !== window) {
    const tgt = (e as any).target as HTMLScriptElement;
    if (tgt.tagName === 'SCRIPT' && tgt.src) {
      // eslint-disable-next-line no-console
      console.error('[chunk-debug] <script> failed to load', { src: tgt.src, type: tgt.type });
      probeChunkUrl(tgt.src).then((p) =>
        // eslint-disable-next-line no-console
        console.error('[chunk-debug] probe result for', tgt.src, p),
      );
    }
  }
  handleChunkLoadFailure('error', (e as any).error || (e as any).message);
}, true);
window.addEventListener('unhandledrejection', (e) => handleChunkLoadFailure('unhandledrejection', e.reason));

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
  // App mounted successfully — no further reload recovery needed this session.
})();
