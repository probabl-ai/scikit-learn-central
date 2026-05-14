# scikit-learn-central

Scikit-learn Central — an interactive ecosystem explorer for the scikit-learn universe. Browse compatible packages by nature, scope & license; discover real-world ML use cases tagged by industry & technique; see sample code instantly. Built with the :probabl. design system.

Deployed at **<https://scikit-learn-central.probabl.ai>**.

---

## Stack

- **Frontend**: Vue 3 + TypeScript + Vite + vue-router
- **Styling**: custom :probabl. design system (`src/assets/css/`)
- **Data**: static JSON in `data/` (catalog, packages, use cases, stats, releases) bundled at build time via `import.meta.glob`
- **Environment**: [pixi](https://pixi.sh) (conda-forge) provides Node.js + Python — one tool for both the frontend toolchain and the Python data scripts
- **Hosting**: GitHub Pages (built `dist/` artifact)
- **MCP server**: separate Cloudflare Worker in `mcp/` (unchanged by the frontend rewrite)

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

Open <http://localhost:5173>. Vite serves with hot reload — edits to `src/**/*.vue`, `src/**/*.ts` or files in `data/` appear instantly.

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
| `pixi run -e scripts update-releases` | Refresh `data/releases/scikit-learn.json` (needs the `scripts` env — adds requests/bs4/lxml) |
| `pixi run mcp-bundle` | Regenerate the MCP worker data bundle |

---

## Project layout

```
.
├── pixi.toml              # conda env + cross-platform task runner
├── package.json           # npm deps (Vue, Vite, vue-tsc, …)
├── vite.config.ts         # Vite config (@ → src, @data → data)
├── tsconfig*.json         # TS project references (app + node)
├── index.html             # Vite entry HTML
├── env.d.ts               # Vite/Vue type shims
│
├── src/
│   ├── main.ts            # createApp + router
│   ├── App.vue            # shell: header + tabs + <router-view/>
│   ├── router/            # vue-router (hash mode, matches old #catalog URLs)
│   ├── views/             # one .vue per top-level route
│   │   ├── PackagesView.vue   # ✅ ported
│   │   ├── UseCasesView.vue   # 🚧 placeholder
│   │   ├── ReleasesView.vue   # 🚧 placeholder
│   │   └── AboutView.vue      # 🚧 placeholder
│   ├── components/        # reusable pieces (PackageCard, FilterDropdown, …)
│   ├── composables/       # usePackages, useUseCases (load + memoise data)
│   ├── types/             # TS shapes matching data/*.json
│   ├── utils/             # fmt() etc.
│   └── assets/css/        # :probabl. design system + components
│
├── public/                # copied verbatim into dist/
│   ├── CNAME              # → scikit-learn-central.probabl.ai
│   ├── images/            # logos, OG images, spark.svg
│   └── fonts/             # Switzer woff2 files
│
├── data/                  # source of truth — also consumed by mcp/
│   ├── catalog.json
│   ├── packages/*.json    # one per package
│   ├── use-cases.json
│   ├── use-cases/*.{json,py}
│   ├── releases/scikit-learn.json
│   └── stats.json         # auto-refreshed daily
│
├── scripts/               # Python data-refresh scripts (pixi-managed)
├── mcp/                   # Cloudflare Python Worker (separate deploy)
├── skills/                # sklearn-expert skill markdown
└── .github/workflows/     # CI: Pages deploy, stats cron, MCP deploy
```

### How `data/` is consumed at build time

`src/composables/usePackages.ts` and `useUseCases.ts` use Vite's `import.meta.glob('@data/packages/*.json', { eager: true })` to bundle every JSON file into the compiled JS. This means:

- No runtime `fetch()` calls — everything ships in the bundle
- Adding a new package: drop `data/packages/foo.json` + add `"foo"` to `data/catalog.json` → rebuild
- The daily stats cron commits `data/stats.json`, which triggers a rebuild + redeploy

The MCP worker reads the same `data/` directory at its own build time via `mcp/generate_bundle.py`.

---

## Migration status

The current scaffold ports the **package catalog view** (hero + filters + grid) end-to-end. The other tabs (use cases, releases, about) are loaded but render a placeholder. Migrate one view at a time by editing the corresponding `src/views/*.vue` and adding components to `src/components/`.

---

## GitHub workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `static.yml` | push to `main` + manual | `pixi run build` → upload `dist/` → Pages deploy |
| `update-stats.yml` | daily 06:00 UTC + push to `data/catalog.json` | `pixi run update-stats` → commit if changed → dispatch `static.yml` |
| `update-release-metadata.yml` | weekly Mon 06:00 UTC + push to release JSON | `pixi run -e scripts update-releases` → commit if changed → dispatch `static.yml` |
| `deploy-mcp.yml` | push to `data/` or `mcp/` | `wrangler deploy` from `mcp/` (unchanged) |

---

## License

See [LICENSE](./LICENSE) — source-available for reference only; commercial use, forks, and public re-deployment require permission from Probabl SAS.
