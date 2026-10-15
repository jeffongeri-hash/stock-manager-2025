import type { Plugin, ResolvedConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Build-time prerender: after the client build, SSR-builds src/entry-server.tsx,
 * renders every URL in public/sitemap.xml and writes dist/<route>/index.html
 * with the real body markup and the per-route react-helmet-async head.
 * Failures never break the build — the route just keeps the SPA shell.
 */
export function prerenderPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "profit-pathfinder-prerender",
    apply: "build",
    configResolved(c) { config = c; },
    async closeBundle() {
      if (config.build.ssr || process.env.PRERENDER_CHILD) return;
      const root = config.root;
      const outDir = path.resolve(root, config.build.outDir);
      const ssrOut = path.resolve(root, "node_modules/.prerender-ssr");
      try {
        process.env.PRERENDER_CHILD = "1";
        const { build } = await import("vite");
        await build({
          configFile: path.resolve(root, "vite.config.ts"),
          mode: config.mode,
          logLevel: "warn",
          build: { ssr: path.resolve(root, "src/entry-server.tsx"), outDir: ssrOut, emptyOutDir: true, copyPublicDir: false },
          ssr: { noExternal: [/\.css$/] },
        });
        installServerShims();
        const entry = fs.readdirSync(ssrOut).find((f) => /^entry-server\.(m?js)$/.test(f))!;
        const mod = await import(pathToFileURL(path.join(ssrOut, entry)).href + `?t=${Date.now()}`);
        const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
        const sitemap = fs.readFileSync(path.resolve(root, "public/sitemap.xml"), "utf8");
        const routes = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
        let ok = 0;
        for (const route of routes) {
          try {
            const blog = route.match(/^\/blog\/([a-z0-9-]+)$/);
            const blogSrc = blog && path.resolve(root, `public/blog/${blog[1]}.html`);
            let page: string;
            if (blogSrc && fs.existsSync(blogSrc)) {
              page = fs.readFileSync(blogSrc, "utf8"); // standalone static article
            } else {
              const { html, helmet } = await mod.render(route);
              page = injectHead(template, helmet).replace('<div id="root"></div>', `<div id="root">${html}</div>`);
            }
            if (route === "/") page = toFallbackShell(page, mod.knownRoutes || []);
            const file = route === "/" ? path.join(outDir, "index.html") : path.join(outDir, route.slice(1), "index.html");
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, page);
            ok++;
          } catch (err) {
            console.warn(`[prerender] skipped ${route}:`, (err as Error)?.message || err);
          }
        }
        console.log(`[prerender] wrote ${ok}/${routes.length} routes`);
      } catch (err) {
        console.warn("[prerender] disabled for this build:", (err as Error)?.message || err);
      } finally {
        delete process.env.PRERENDER_CHILD;
        fs.rmSync(ssrOut, { recursive: true, force: true });
      }
    },
  };
}

function injectHead(template: string, helmet: any): string {
  if (!helmet) return template;
  // Drop static tags that the per-route Helmet output replaces.
  let out = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta\s+name="(description|robots|twitter:card|twitter:title|twitter:description|twitter:image)"[^>]*>\s*/g, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/g, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, "");
  const head = [helmet.title, helmet.meta, helmet.link, helmet.script].map((h: any) => h?.toString() || "").join("\n");
  return out.replace("</head>", `${head}\n</head>`);
}

/**
 * dist/index.html doubles as the hosting fallback for unknown paths (Lovable
 * hosting cannot return a real 404). Drop the static homepage canonical/og:url
 * (Helmet re-adds the canonical on "/" client-side) and noindex any path that
 * isn't a known route before the app boots.
 */
function toFallbackShell(page: string, known: string[]): string {
  const out = page
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, "")
    .replace(/<meta\s+property="og:url"[^>]*>\s*/g, "");
  const guard = `<script>(function(){var k=${JSON.stringify(known)};var p=location.pathname.replace(/\\/+$/,"")||"/";if(k.indexOf(p)<0){var m=document.createElement("meta");m.name="robots";m.content="noindex";document.head.appendChild(m);}})();</script>`;
  return out.replace("<head>", `<head>\n${guard}`);
}

function installServerShims() {
  const g = globalThis as any;
  const mem = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, String(v)), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  };
  g.localStorage ??= mem();
  g.sessionStorage ??= mem();
}
