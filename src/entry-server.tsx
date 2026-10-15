// Build-time prerender entry (used only by scripts/prerender-plugin.ts).
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { AppShell } from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { pageSEO, extraKnownRoutes } from "./lib/seo-config";

export const knownRoutes = [...Object.keys(pageSEO), ...extraKnownRoutes];

export function render(url: string): Promise<{ html: string; helmet: HelmetServerState | undefined }> {
  const helmetContext: { helmet?: HelmetServerState } = {};
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _enc, cb) { html += chunk.toString(); cb(); },
      final(cb) { resolve({ html, helmet: helmetContext.helmet }); cb(); },
    });
    const timer = setTimeout(() => { stream.abort(); }, 15000);
    const stream = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <StaticRouter location={url}>
            <AppShell />
          </StaticRouter>
        </ThemeProvider>
      </HelmetProvider>,
      {
        onAllReady() { clearTimeout(timer); stream.pipe(sink); },
        onShellError(err) { clearTimeout(timer); reject(err); },
        onError(err) { console.warn(`[prerender] ${url}:`, (err as Error)?.message || err); },
      },
    );
  });
}
