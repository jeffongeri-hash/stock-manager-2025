// Keep the entry file dependency-free so it can run even when React/Vite
// dependency chunks fail to import. This lets us clear stale service workers,
// log the exact failed module URL, and avoid blank-screen reload loops before
// loading the real app bundle from ./bootstrap.
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
  if (reason?.filename) return String(reason.filename);
  if (reason?.target?.src) return String(reason.target.src);
  return null;
}

function renderBootFailure(message: string) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#080b12;color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <section style="max-width:680px;border:1px solid rgba(148,163,184,.28);background:rgba(15,23,42,.82);padding:24px;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.35);">
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.2;">Profit Pathfinder could not load the app bundle.</h1>
        <p style="margin:0;color:#cbd5e1;line-height:1.6;">A cached or interrupted module request failed. Refresh once; if it persists, check the console for <code>[chunk-debug]</code> diagnostics.</p>
        <pre style="margin:16px 0 0;white-space:pre-wrap;color:#93c5fd;font-size:12px;line-height:1.5;">${message.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] || c)}</pre>
      </section>
    </main>`;
}

function handleChunkLoadFailure(source: 'error' | 'unhandledrejection' | 'bootstrap-import', reason: unknown) {
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
    renderBootFailure(msg);
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
  handleChunkLoadFailure('error', (e as any).error || e);
}, true);
window.addEventListener('unhandledrejection', (e) => handleChunkLoadFailure('unhandledrejection', e.reason));

async function clearServiceWorkersAndCaches() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
  }
}

async function preflightBeforeReact() {
  if (!('serviceWorker' in navigator)) return true;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const controlledBySw = Boolean(navigator.serviceWorker.controller);
    const hasRegistrations = regs.length > 0;

    if (!controlledBySw && !hasRegistrations) return true;

    console.warn('[chunk-debug] clearing service workers before app boot', {
      controlledBySw,
      registrations: regs.map((r) => ({ scope: r.scope, scriptURL: r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL })),
      currentUrl: window.location.href,
    });

    await clearServiceWorkersAndCaches();

    if (controlledBySw && sessionStorage.getItem('pp_sw_preflight_reloaded_once') !== '1') {
      sessionStorage.setItem('pp_sw_preflight_reloaded_once', '1');
      const url = new URL(window.location.href);
      url.searchParams.set('sw-preflight-cleanup', Date.now().toString());
      window.location.replace(url.toString());
      return false;
    }
  } catch (e) {
    console.warn('[chunk-debug] service worker preflight cleanup failed', e);
  }

  return true;
}

(async () => {
  const shouldBoot = await preflightBeforeReact();
  if (!shouldBoot) return;

  try {
    const { mountApp } = await import('./bootstrap');
    mountApp();
  } catch (e) {
    handleChunkLoadFailure('bootstrap-import', e);
    if (sessionStorage.getItem('pp_chunk_reloaded_once') === '1') {
      renderBootFailure(String((e as any)?.message || e || 'Unknown module import failure'));
    }
  }
})();
