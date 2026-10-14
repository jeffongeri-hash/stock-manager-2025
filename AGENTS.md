# AGENTS.md

- Every URL in public/sitemap.xml is prerendered at build time by scripts/prerender-plugin.ts (SSR of src/entry-server.tsx using `AppShell`); keep page components SSR-safe (no browser globals at module scope/render) so crawlers get real HTML. Why: the SPA shell alone shows crawlers an empty page.
- `App.tsx` exports `AppShell` (everything inside the router) so the browser (BrowserRouter) and the prerender (StaticRouter) share one route tree. Why: one source of truth for routes.
- /blog/* sitemap URLs are emitted from the standalone public/blog/<slug>.html files. Why: that content lives only there.
