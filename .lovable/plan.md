
## Goal
Rank Profit Pathfinder for "Coast FIRE Tracker" first, then Coast FIRE / early retirement / FIRE for beginners. Ship a real Coast FIRE Tracker page + supporting SEO pages, fix technical SEO across the site, and re-run the Lovable SEO review.

## New pages (all public, indexed, in sitemap)

1. **`/coast-fire-tracker`** — the hero SEO page. New React route at `src/pages/CoastFireTracker.tsx`.
   - Interactive Coast FIRE tracker (current age, retirement age, current invested, annual spending, SWR %, expected real return). Computes FIRE number, Coast FIRE number today, gap, % to Coast, and a year-by-year projection (Chart.js — already vendored locally).
   - Sections: What is a Coast FIRE tracker · How to calculate · Formula · Assumptions · Update cadence · Coast vs traditional FIRE · Coast vs Barista · Beginner example · Common mistakes · FAQ · CTA.
   - One `<h1>Coast FIRE Tracker</h1>`. Above-fold CTA "Open the Free Coast FIRE Tracker" + secondary "Calculate My Coast FIRE Number". Educational disclaimer.
   - JSON-LD: `SoftwareApplication` + `BreadcrumbList` + `FAQPage`.

2. **`/coast-fire-calculator`** — keep route, rewrite as a real React page (replace current iframe-only version) with H1 "Coast FIRE Calculator", own H1, copy, internal link to `/coast-fire-tracker` with anchor text "Coast FIRE Tracker".

3. **`/what-is-coast-fire`** — new explainer page (React component). H1 "What Is Coast FIRE?". Links to tracker + calculator.

4. **`/fire-for-beginners`** — new beginner guide. H1 "FIRE for Beginners". Links to tracker.

5. **`/early-retirement-calculator`** — new calculator + content page. H1 "Early Retirement Calculator". Computes FIRE number / years to FI / savings-rate impact. Links to tracker.

## Homepage updates (`src/pages/landing-assets/landing.body.html` + `landing.script.js`)

- Single H1 → "Track Your Path to Financial Independence".
- Hero subcopy → "Use free calculators and trackers for Coast FIRE, early retirement, dividend income, portfolio growth, and long-term wealth planning."
- First feature card becomes **Coast FIRE Tracker** ("Calculate your Coast FIRE number, track your gap, and compare retirement scenarios.") linking to `/coast-fire-tracker`.
- Hero primary CTA links to `/coast-fire-tracker` ("Open the Free Coast FIRE Tracker").
- Footer gets a "FIRE Tools" column: Coast FIRE Tracker, Coast FIRE Calculator, Early Retirement Calculator, FIRE for Beginners.

## Site-wide nav / footer (`TopNav.tsx`, landing footer)
- Add "Coast FIRE" item to TopNav primary nav pointing to `/coast-fire-tracker`.
- Add FIRE Tools section to landing footer.

## Metadata + canonical (`src/lib/seo-config.ts`)
- Add entries for the 5 new routes with the exact title/description from the brief.
- Update `/` entry to new title/description.
- Audit all entries: each gets unique description (no duplicates), keywords, and is canonical via `<SEOHead/>` (which already self-canonicals each pathname).
- Confirm `useSEO` writes `og:url`, `og:title`, `og:description`, `og:image`, `twitter:*` (it already does).

## index.html
- Remove the `WebApplication` block from the static JSON-LD graph (per-page React-Helmet schemas own that). Keep Organization + WebSite.
- Title stays generic; per-route Helmet overrides.
- Already self-canonical-free; per-route canonical via Helmet is correct.

## sitemap.xml (`public/sitemap.xml`)
- Add the 5 new URLs.
- Remove non-indexable / removed URLs: `/risk-metrics`, `/portfolio-rebalancing` (both now `Navigate` redirects), `/ai-trade-journal`, `/ai-trade-journal-demo`, `/premarket-brief`, `/weekly-fundamental-scan`, `/fire-planning-suite` (all `AdminRoute` — gated, not public).
- Keep public-only routes; bump `/coast-fire-tracker` priority to 1.0.

## robots.txt (`public/robots.txt`)
- Keep `Allow: /` and Sitemap line.
- Add explicit `Disallow:` for admin-gated routes (`/ai-trade-journal`, `/ai-trade-journal-demo`, `/premarket-brief`, `/weekly-fundamental-scan`, `/fire-planning-suite`, `/risk-metrics`, `/portfolio-rebalancing`).
- Do NOT block JS/CSS/images/fonts.

## llms.txt (`public/llms.txt`)
- Refresh: lead with Coast FIRE Tracker. Remove dead/gated entries. Add the 5 new pages.

## SEO review
- After all edits, call `seo_chat--list_findings`, fix any remaining items, then `seo_chat--trigger_scan` (requires user approval). Report final table of public SEO pages: route · title · description · canonical · in sitemap.

## What I will NOT change
- Backend, auth, RLS, edge functions.
- IgniteFIRE pages (already removed per memory).
- Existing tool routes' business logic.

## Technical notes
- Coast FIRE formula used on tracker + calculator: `FIRE# = AnnualSpend / SWR`, `CoastToday = FIRE# / (1 + r)^years`. Real-return default 5%, SWR default 4%.
- Tracker chart: line chart of projected portfolio value if no further contributions, vs target FIRE number at retirement age.
- Pages render inside existing `PageLayout` (TopNav + Orbs) so they match the global shell.
- Per-page Helmet adds `BreadcrumbList` schema using current pathname.

Once you approve I'll ship it in one pass.
