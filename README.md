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
| `pixi run dev` | Vite dev server with HMR |
| `pixi run build` | `vue-tsc --build && vite build` → `dist/` |
| `pixi run preview` | Serve the production build locally |
| `pixi run type-check` | Run `vue-tsc` without emitting files |
| `pixi run update-stats` | Refresh `data/stats.json` from GitHub + PyPI |
| `pixi run -e scripts update-releases` | Refresh `data/releases/scikit-learn.json` (uses the `scripts` env — adds requests/bs4/lxml) |
| `pixi run mcp-bundle` | Regenerate the MCP worker data bundle |

---

## Views (all routes)

| Route | Component | Notes |
|---|---|---|
| `/catalog` | `PackagesView` | Sklearn hero + filter bar (nature/scope/license + sort) + ranked package grid with Fit Score chip |
| `/use-cases` | `UseCasesView` | Filter bar (industry/technique/difficulty) + use-case grid + lazy-loaded code modal with syntax highlighting |
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
│   │   ├── ViewTabs.vue          # button-based tabs (no underline regression)
│   │   ├── FilterDropdown.vue    # generic over filter-value type
│   │   ├── SklearnHero.vue
│   │   ├── PackageCard.vue       # Fit-score chip + Probabl-boost variant
│   │   ├── UseCaseCard.vue
│   │   ├── ReleaseCard.vue
│   │   ├── ReleasesBlogStrip.vue
│   │   ├── CodeModal.vue         # lazy-loads .py source per use case
│   │   ├── BaseModal.vue         # reusable modal shell (ESC, backdrop, scroll-lock)
│   │   ├── FormSuccess.vue
│   │   ├── SubmitPackageModal.vue
│   │   ├── SubmitUseCaseModal.vue
│   │   └── SubmitFeedbackModal.vue
│   ├── composables/
│   │   ├── usePackages.ts        # catalog + stats merge + fit-score computation
│   │   ├── useUseCases.ts        # respects data/use-cases.json as publish allowlist
│   │   ├── useReleases.ts        # version-sorted releases (future first)
│   │   ├── useSubmitModal.ts     # which submit modal is open (singleton)
│   │   └── useFormSubmit.ts      # idle/submitting/success/error state machine
│   ├── types/                    # TS shapes matching data/*.json
│   ├── utils/
│   │   ├── format.ts             # fmt() compact number formatter
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
│   ├── use-cases/*.{json,py}
│   ├── releases/scikit-learn.json
│   └── stats.json         # auto-refreshed daily
│
├── scripts/               # Python data-refresh scripts (pixi-managed)
├── mcp/                   # Cloudflare Python Worker (separate deploy)
├── skills/                # repo-tracked skills (sklearn-expert)
└── .github/workflows/     # CI: Pages deploy, stats cron, release cron, MCP deploy
```

### How `data/` is consumed at build time

The composables use Vite's `import.meta.glob` to bundle every JSON file into the compiled JS — no runtime `fetch()`.

- **Packages**: `data/catalog.json` lists package IDs; each ID resolves to `data/packages/{id}.json`. Live stats are merged from `data/stats.json`. Adding a new package: drop `data/packages/foo.json` + add `"foo"` to `data/catalog.json`'s `packages` array → rebuild.
- **Use cases**: `data/use-cases.json` is the **publish allowlist** — only UUIDs listed in `use_cases` appear on the site. Other JSON files in `data/use-cases/` are drafts that live in the repo but render only in the MCP server. Promote a draft by adding its UUID to `data/use-cases.json`.
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

## License

See [LICENSE](./LICENSE) — source-available for reference only; commercial use, forks, and public re-deployment require permission from Probabl SAS.
