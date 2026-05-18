# scikit-learn-central

scikit-learn Central — an interactive ecosystem explorer for the scikit-learn universe. Browse compatible packages by nature, scope & license; discover real-world ML use cases tagged by industry & technique; see sample code instantly. Built with the :probabl. design system.

Deployed at **<https://scikit-learn-central.probabl.ai>**.

---

## Stack

- **Frontend**: Vue 3 + TypeScript + Vite + vue-router (hash history)
- **Styling**: custom :probabl. design system aligned with the canonical [probabl.ai](https://probabl.ai) tokens (`src/assets/css/`)
- **Data**: static JSON in `data/` (catalog, packages, use cases, stats, releases) bundled at build time via `import.meta.glob`
- **Environment**: [pixi](https://pixi.sh) (conda-forge) provides Node.js + Python — one tool for both the frontend toolchain and the Python data scripts
- **Hosting**: GitHub Pages (built `dist/` artifact)
- **Submissions**: forms POST to a probabl n8n webhook (Submit Package / Use Case / Feedback)
- **MCP server**: separate Cloudflare Worker in `mcp/` (independent deploy)

---

## Getting started

### 1. Install pixi

```bash
curl -fsSL https://pixi.sh/install.sh | bash
```

(or see <https://pixi.sh/latest/#installation> for other platforms)

### 2. Clone & install

```bash
git clone https://github.com/<org>/scikit-learn-central.git
cd scikit-learn-central
pixi install        # installs Node.js + Python from conda-forge
```

`npm install` is wired as a pixi task and runs automatically the first time you call `pixi run dev` or `pixi run build`.

### 3. Run the dev server

```bash
pixi run dev
```

Open <http://localhost:5173>. Vite serves with hot reload — edits to `src/**/*.vue`, `src/**/*.ts`, or files in `data/` appear instantly.

### 4. Build for production

```bash
pixi run build      # type-checks then writes dist/
pixi run preview    # serves dist/ at http://localhost:4173 for verification
```

---

## Pixi tasks

| Task | What it does |
|---|---|
| `pixi run install` | `npm install` (cached; only re-runs when `package.json` changes) |
| `pixi run dev` | Vite dev server with HMR. Also runs `link-jupyterlite` so the in-browser notebooks work in dev once you've built them. |
| `pixi run build` | **Full production build**: Vue site → `dist/` and JupyterLite → `dist/jupyterlite/`. Orchestrates `build-frontend` + `build-jupyterlite`. |
| `pixi run build-frontend` | Vue site only (faster iteration when notebooks haven't changed). |
| `pixi run -e jupyterlite build-jupyterlite` | JupyterLite only — converts `data/use-cases/*.py` → `.ipynb` via jupytext, then `jupyter lite build`. |
| `pixi run link-jupyterlite` | Symlink `public/jupyterlite` → `dist/jupyterlite` so the Vite dev server can serve `/jupyterlite/...`. Idempotent; warns if you haven't built yet. |
| `pixi run unlink-jupyterlite` | Remove the symlink (auto-run before `build-frontend` so it never leaks into production `dist/`). |
| `pixi run preview` | Serve the production build locally on `http://localhost:4173`. |
| `pixi run type-check` | Run `vue-tsc` without emitting files. |
| `pixi run update-stats` | Refresh `data/stats.json` from GitHub + PyPI + codecov + coveralls. |
| `pixi run -e scripts update-releases` | Refresh `data/releases/scikit-learn.json` (uses the `scripts` env — adds requests/bs4/lxml). |
| `pixi run -e scripts update-release-reactions` | Refresh GitHub reaction counts for release highlights. |
| `pixi run mcp-bundle` | Regenerate the MCP worker data bundle. |
| `pixi run -e datasets fetch-datasets` | One-off: download california housing + german credit and commit them as CSV under `data/use-cases/datasets/`. |
| `pixi run migrate-categories` | One-off migration: replace legacy `nature`+`scope` with the categories taxonomy (issue #16). |

---

## Views (all routes)

| Route | Component | Notes |
|---|---|---|
| `/catalog` | `PackagesView` | Sklearn hero + filter bar (categories/licenses/tags + sort + group-by) + cards/list layout toggle, package cards with Fit Score chip |
| `/use-cases` | `UseCasesView` | Filter bar (industry/technique/difficulty) + cards/list layout + use-case grid. Each card has an **Open in JupyterLite** action that deep-links to the in-browser notebook for that use case. |
| `/releases` | `ReleasesView` | Blog strip + release cards with version, highlights (with GitHub reaction counts), tag-stats bar, CTA buttons |
| `/about` | `AboutView` | Purpose, sub-committees, ranking methodology, feedback CTA |
| `/components` | `Components` | **Dev-only** sandbox mounting every component with live data — excluded from production builds |

The header's primary action button is route-aware:

- `/catalog` → Submit Package modal
- `/use-cases` → Submit Use Case modal
- `/releases` → opens scikit-learn's `CONTRIBUTING` page in a new tab
- `/about` → Submit Feedback modal

All three submission forms POST a JSON payload to `https://probabl.app.n8n.cloud/webhook/<id>` (see `src/utils/submitForm.ts`). Inputs are sanitized (HTML tags stripped, trimmed, length-capped) before submission.

---

## Project layout

```
.
├── pixi.toml              # conda env + cross-platform task runner
├── package.json           # npm deps (Vue, Vite, vue-tsc, vue-router)
├── vite.config.ts         # Vite config (@ → src, @data → data)
├── tsconfig*.json         # TS project references (app + node)
├── index.html             # Vite entry HTML (font-awesome + highlight.js CDN)
├── env.d.ts               # Vite/Vue + window.hljs type shims
├── AGENTS.md              # coding conventions for AI assistants (smart/dumb split, etc.)
│
├── src/
│   ├── main.ts            # createApp + router + global CSS
│   ├── App.vue            # shell: header + tabs + <router-view/> + submit modals
│   ├── router/            # vue-router; /components route gated on import.meta.env.DEV
│   ├── views/
│   │   ├── PackagesView.vue
│   │   ├── UseCasesView.vue
│   │   ├── ReleasesView.vue
│   │   ├── AboutView.vue
│   │   └── Components.vue        # dev-only sandbox (tree-shaken from prod)
│   ├── components/
│   │   ├── AppHeader.vue
│   │   ├── ViewTabs.vue                # button-based tabs (no underline regression)
│   │   ├── FilterDropdown.vue          # generic over filter-value type
│   │   ├── FilterBottomSheet.vue       # mobile filter sheet (full-screen)
│   │   ├── SklearnHero.vue
│   │   ├── CatalogListShell.vue        # shared header/list layout for catalog + use-cases
│   │   ├── PackageCard.vue             # 6-axis Fit-score chip + use-case + activity signals
│   │   ├── PackageListRow.vue          # list-layout row variant of PackageCard
│   │   ├── PackageListColumnHeader.vue
│   │   ├── FitScoreHelpPopover.vue     # 6-axis explainer popover (catalog header)
│   │   ├── UseCaseCard.vue             # icon-only copy-link + GitHub + Open-in-JupyterLite
│   │   ├── UseCaseListRow.vue          # list-layout row variant of UseCaseCard
│   │   ├── UseCaseListColumnHeader.vue
│   │   ├── DifficultyBadge.vue         # beginner/intermediate/advanced pill
│   │   ├── CodeModal.vue               # syntax-highlighted use-case .py viewer
│   │   ├── ReleaseCard.vue
│   │   ├── ReleasesBlogStrip.vue
│   │   ├── BaseModal.vue               # reusable modal shell (ESC, backdrop, scroll-lock)
│   │   ├── FormSuccess.vue
│   │   ├── TransientFeedback.vue       # short-lived inline toast (e.g. copy-to-clipboard)
│   │   ├── SubmitPackageModal.vue
│   │   ├── SubmitUseCaseModal.vue
│   │   └── SubmitFeedbackModal.vue
│   ├── composables/
│   │   ├── usePackages.ts                    # catalog + stats merge + fit-score computation
│   │   ├── usePackageLookup.ts               # id → package resolution helper
│   │   ├── usePackageCatalogGroups.ts        # group-by (main/category/license/none) for catalog
│   │   ├── usePackageCatalogItem.ts          # per-card state (highlight, deep-link, etc.)
│   │   ├── useUseCases.ts                    # respects data/use-cases.json as publish allowlist
│   │   ├── useUseCaseCatalogGroups.ts        # group-by for use-cases
│   │   ├── useUseCaseCatalogItem.ts
│   │   ├── useUseCaseDescriptionExpand.ts
│   │   ├── useUseCasePackagesExpand.ts
│   │   ├── useUseCasePackagesPanelHeights.ts
│   │   ├── useCatalogDescriptionExpand.ts    # shared expand/collapse state for cards
│   │   ├── useCopyPipInstall.ts              # copy `pip install …` w/ transient feedback
│   │   ├── useReleases.ts                    # version-sorted releases (future first)
│   │   ├── useReleaseCardHighlights.ts
│   │   ├── useReleaseHighlightsExpand.ts
│   │   ├── useReleasesBlogStripOverflow.ts
│   │   ├── useSubmitModal.ts                 # which submit modal is open (singleton)
│   │   ├── useFormSubmit.ts                  # idle/submitting/success/error state machine
│   │   └── useTransientFeedback.ts           # drives TransientFeedback toasts
│   ├── types/                    # TS shapes matching data/*.json
│   ├── utils/
│   │   ├── format.ts             # fmt() compact number formatter
│   │   ├── relativeTime.ts       # "3 days ago" formatter
│   │   ├── packageCategory.ts    # categories taxonomy metadata helpers
│   │   ├── releaseUrls.ts        # GitHub release / changelog URL helpers
│   │   └── submitForm.ts         # sanitizeText + postToWebhook
│   └── assets/css/
│       ├── design-system.css     # tokens (colors/typography/easing/durations)
│       └── components.css        # component-specific styling
│
├── public/                # copied verbatim into dist/
│   ├── CNAME              # → scikit-learn-central.probabl.ai
│   ├── images/
│   └── fonts/             # Switzer woff2 files
│
├── data/                  # source of truth — also consumed by mcp/
│   ├── catalog.json
│   ├── packages/*.json
│   ├── use-cases.json     # publish allowlist (see below)
│   ├── use-cases/*.{json,py}                 # published use cases + their datasets/
│   ├── use-cases-to-be-validated/*.{json,py} # submitted via the webhook, awaiting curation
│   ├── releases/scikit-learn.json
│   └── stats.json         # auto-refreshed daily
│
├── scripts/                          # Python helper scripts (all pixi-managed)
│   ├── update_stats.py               # daily GitHub + PyPI + codecov + coveralls refresh
│   ├── update_release_metadata.py    # weekly sklearn-releases refresh (uses `scripts` env)
│   ├── update_release_reactions.py   # GitHub reaction counts for release highlights
│   ├── build_jupyterlite.py          # data/use-cases/*.py → dist/jupyterlite/
│   ├── link_jupyterlite.py           # dev-only symlink helper (see below)
│   ├── fetch_datasets.py             # one-off: refresh embedded CSVs (uses `datasets` env)
│   ├── migrate_categories.py         # one-off: nature+scope → categories taxonomy (#16)
│   └── migrate_use_cases.py          # one-off: legacy use-case schema migration
│
├── data/jupyterlite/                 # ↳ NOT in repo — built into dist/jupyterlite/
├── public/jupyterlite                # ↳ NOT in repo — dev-only symlink to dist/jupyterlite
│
├── mcp/                              # Cloudflare Python Worker (separate deploy)
├── skills/                           # repo-tracked skills (sklearn-expert)
└── .github/workflows/                # CI: Pages deploy, stats cron, release cron, MCP deploy
```

### How `data/` is consumed at build time

The composables use Vite's `import.meta.glob` to bundle every JSON file into the compiled JS — no runtime `fetch()`.

- **Packages**: `data/catalog.json` lists package IDs; each ID resolves to `data/packages/{id}.json`. Live stats are merged from `data/stats.json`. Adding a new package: drop `data/packages/foo.json` + add `"foo"` to `data/catalog.json`'s `packages` array → rebuild.
- **Use cases**: `data/use-cases.json` is the **publish allowlist** — only IDs listed in `use_cases` appear on the site. Published use cases live in `data/use-cases/` (slug-named); user-submitted drafts coming through the Submit Use Case form land in `data/use-cases-to-be-validated/` (UUID-named) and render only in the MCP server. Promote a draft by curating it into `data/use-cases/` and adding its ID to `data/use-cases.json`.
- **Use-case code**: `.py` files in `data/use-cases/` are lazy-loaded per click via `import.meta.glob('@data/use-cases/*.py', { query: '?raw' })` — each file is its own chunk.
- **Stats**: the daily stats cron commits `data/stats.json`, which triggers a rebuild + redeploy.

The MCP worker reads the same `data/` directory at its own build time via `mcp/generate_bundle.py`.

---

## Dev-only Components sandbox

Mount and visually test every component without touching the real views. `Components.vue` imports each component, supplies sample props from the live data, and includes triggers for every modal.

```bash
pixi run dev
# open http://localhost:5173/#/components
```

The `/components` route and its tab are gated on `import.meta.env.DEV`:

```ts
if (import.meta.env.DEV) {
  routes.push({ path: '/components', ... })
}
```

Vite statically replaces `import.meta.env.DEV` at build time, so the entire branch — including the dynamic `import('@/views/Components.vue')` — is dead-code-eliminated in production. The `Components.vue` file is never bundled into `dist/`.

Adding a new component to the sandbox: import it at the top of `Components.vue`, drop a `<section class="sandbox-section">` with sample props. No router or tab changes needed.

---

## Design system

CSS tokens in `src/assets/css/design-system.css` mirror probabl.ai's canonical brand variables:

- `--brand-typography--title` — IBM Plex Serif (Light, weight 300) for all headings
- `--brand-typography--texte` — Switzer for UI/body
- `--brand-typography-size--heading-h1…h6` — `3.75 / 3.5 / 3 / 2.5 / 2 / 1.625 rem`
- `--brand-typography-size--body-xl/l/m/s/xs` — `1.25 / 1.125 / 1 / 0.875 / 0.75 rem`
- Brand palette: `#040524` midnight, `#1b1d58` deep blue, `#34366d` lines, `#ff7900` orange, `#4cd0ff` sky
- Mono font: `JetBrains Mono` via Google Fonts (matches probabl.ai)

Transitions follow [Emil Kowalski's design-engineering principles](https://emilkowal.ski/skill):

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` — strong ease-out for entries/exits
- Buttons get press feedback via `transform: scale(0.97)` on `:active`
- Popovers (filter dropdown, ranking tooltip) scale-in from their trigger, with `transform-origin` set to the trigger location
- Modals scale from `0.97 → 1` over 280 ms ease-out (center-anchored)
- `prefers-reduced-motion: reduce` collapses transforms to instant while keeping opacity transitions for comprehension
- Card grids stagger their first 7 items by 40 ms each, with everything after lining up at 280 ms

The reference skill lives at `.claude/skills/emil-design-eng/SKILL.md` (loaded by Claude Code locally; not version-controlled).

---

## GitHub workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `static.yml` | push to `main` + manual | `pixi run build` → upload `dist/` → Pages deploy |
| `update-stats.yml` | daily 06:00 UTC + push to `data/catalog.json` | `pixi run update-stats` → commit if changed → dispatch `static.yml` |
| `update-release-metadata.yml` | weekly Mon 06:00 UTC + push to release JSON | `pixi run -e scripts update-releases` → commit if changed → dispatch `static.yml` |
| `deploy-mcp.yml` | push to `data/` or `mcp/` | `wrangler deploy` from `mcp/` |

---

## JupyterLite integration

Each use-case card has an **Open in JupyterLite** action that launches a fully interactive Jupyter Notebook tab with the use case's notebook pre-opened. The kernel is Pyodide (Python + scikit-learn in WebAssembly), so it runs entirely client-side.

CI builds the JupyterLite distribution on every deploy: `.py` files under `data/use-cases/` are converted to `.ipynb` via [jupytext](https://jupytext.readthedocs.io/), then `jupyter lite build` writes the static site into `dist/jupyterlite/` (served at `/jupyterlite/` by GitHub Pages, alongside the Vue app).

The whole toolchain — jupytext + jupyterlite-core + the Pyodide kernel + jupyter-server — is managed by pixi under a dedicated `jupyterlite` environment, so there is no separate `pip install` step.

### Local preview (production build)

```bash
pixi run build       # Vue site + JupyterLite → dist/
pixi run preview     # serve dist/ at http://localhost:4173
```

`pixi run build` orchestrates both: the Vue/Vite build (default env) and the JupyterLite build (cross-env into `dist/jupyterlite/`).

### Local dev with a working "Open in JupyterLite" link

`pixi run dev` only serves the Vue source — `/jupyterlite/...` would 404. To make the link work in dev:

```bash
pixi run -e jupyterlite build-jupyterlite   # once: builds dist/jupyterlite/
pixi run dev                                # symlinks public/jupyterlite → dist/jupyterlite, starts Vite
```

`pixi run dev` runs `link-jupyterlite` as a dependency every time, so the symlink is always fresh. The link is dev-only — `pixi run build-frontend` automatically removes it via `unlink-jupyterlite` so production `dist/` never includes it.

Cross-platform note: on Windows without developer mode the symlink call falls back to a recursive copy. Slower (~1 s) but functional.

### Faster iteration loops

```bash
pixi run build-frontend                       # Vue only (skips JupyterLite)
pixi run -e jupyterlite build-jupyterlite     # JupyterLite only
```

### How notebooks become runnable in the browser

Pyodide ships `numpy`, `pandas`, `scikit-learn`, and `matplotlib` out of the box. Anything else a notebook needs (e.g. `skrub`, `skore`) must be installed by an explicit `%pip install …` cell **authored in the `.py` source** using a jupytext cell marker — `scripts/build_jupyterlite.py` no longer injects a synthetic setup cell. piplite resolves the wheels from PyPI on first run.

Datasets used by the use cases live in `data/use-cases/datasets/` and are copied next to the notebooks in the build, so `pd.read_csv("datasets/…")` resolves with no network round-trip.

---

## License

See [LICENSE](./LICENSE) — source-available for reference only; commercial use, forks, and public re-deployment require permission from Probabl SAS.
