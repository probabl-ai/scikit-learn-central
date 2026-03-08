/**
 * app.js — Scikit-learn Central v3
 *
 * Dual-view: "catalog" (package catalog) + "use-cases" (industry use cases).
 * Horizontal filter bars with dropdown panels replace the sidebar.
 * Submit button is context-aware: "Submit Package" vs "Submit Use Case".
 *
 * Data loading strategy (all via HTTP fetch — no file:// fallbacks):
 *   1. data/catalog.json    → catalog structure + package IDs
 *   2. data/packages/*.json → package metadata (fetched in parallel)
 *   3. data/stats.json      → live GitHub + PyPI stats (merged into packages)
 *   4. data/use-cases.json  → use-case dataset
 */
'use strict';

/* ── State ──────────────────────────────────────────────── */
let catalog  = null;
let useCases = null;
let releases = null;

const state = {
  view: 'catalog',
  // Catalog filters
  search: '', nature: new Set(), scope: new Set(), license: new Set(), sortBy: 'ranking',
  // Use-case filters
  ucSearch: '', industry: new Set(), technique: new Set(), difficulty: new Set(),
};

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const [catalogData, ucData, statsData, releasesData] = await Promise.all([
    loadCatalog(),
    loadUseCases(),
    fetchJSON('data/stats.json'),
    fetchJSON('data/releases/scikit-learn.json'),
  ]);

  catalog  = catalogData;
  useCases = ucData;
  releases = releasesData;

  if (!catalog) { showCatalogError(); return; }

  // Merge live stats (stars, downloads, version…) into package objects
  if (statsData) mergeStats(statsData);

  // Compute fit scores once both datasets are ready
  computeFitScores();

  setTabCount('catalog',   catalog.packages.length);
  if (useCases) setTabCount('use-cases', useCases.use_cases.length);
  if (releases) setTabCount('releases', releases.releases.filter(r => r.version !== 'future').length);

  populateCatalogCounts();
  if (useCases) populateUcCounts();

  renderCatalogHero();
  renderCatalogAll();
  if (useCases) renderUcAll();
  if (releases) renderReleasesAll();

  bindEvents();
  applyHash();
});

/* ── Data loading ───────────────────────────────────────── */

/** Generic JSON fetch — returns parsed object or null on any failure. */
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    return r.ok ? r.json() : null;
  } catch (_) { return null; }
}

/** Generic plain-text fetch — returns string or null on any failure. */
async function fetchText(url) {
  try {
    const r = await fetch(url);
    return r.ok ? r.text() : null;
  } catch (_) { return null; }
}

/**
 * Load data/use-cases.json (index), then fetch every individual use-case
 * JSON in parallel.  Archived use cases are filtered out, mirroring loadCatalog().
 *
 * Each element of ucIndex.use_cases is a UUID string that resolves to
 * data/use-cases/{uuid}.json.  The returned object keeps the same shape
 * the rest of app.js expects: { meta: {…}, use_cases: [{…}, …] }
 */
async function loadUseCases() {
  const ucIndex = await fetchJSON('data/use-cases.json');
  if (!ucIndex) return null;

  if (Array.isArray(ucIndex.use_cases) && typeof ucIndex.use_cases[0] === 'string') {
    const items = await Promise.all(
      ucIndex.use_cases.map(uuid => fetchJSON(`data/use-cases/${uuid}.json`))
    );
    ucIndex.use_cases = items.filter(uc => uc && !uc.archived);
  } else {
    // Graceful fallback: old embedded-object format — just filter archived
    ucIndex.use_cases = (ucIndex.use_cases || []).filter(uc => !uc.archived);
  }
  return ucIndex;
}

/**
 * Load catalog.json then fetch every package's JSON in parallel.
 * catalog.json.packages is an array of string IDs; each resolves to
 * data/packages/{id}.json.  Archived packages are filtered out.
 */
async function loadCatalog() {
  const meta = await fetchJSON('data/catalog.json');
  if (!meta) return null;

  if (Array.isArray(meta.packages) && typeof meta.packages[0] === 'string') {
    const pkgs = await Promise.all(
      meta.packages.map(id => fetchJSON(`data/packages/${id}.json`))
    );
    meta.packages = pkgs.filter(p => p && !p.archived);
  } else {
    meta.packages = (meta.packages || []).filter(p => !p.archived);
  }
  return meta;
}

/**
 * Merge data/stats.json into catalog.core and each package object.
 * stats.json is the single source of truth for stars, forks, downloads,
 * latest version, etc.  Package JSON files no longer carry these fields.
 */
function mergeStats(stats) {
  if (!stats?.packages) return;

  // ── Core (scikit-learn) ───────────────────────────────
  const coreStats = stats.packages['scikit-learn'];
  if (coreStats) {
    if (coreStats.github?.stars               != null) catalog.core.stars     = coreStats.github.stars;
    if (coreStats.pypi?.downloads?.last_month != null) catalog.core.downloads = coreStats.pypi.downloads.last_month;
    catalog.core._stats = coreStats;
  }

  // ── Ecosystem packages ────────────────────────────────
  catalog.packages.forEach(pkg => {
    const s = stats.packages?.[pkg.id];
    if (!s) return;
    if (s.github?.stars               != null) pkg.stars     = s.github.stars;
    if (s.pypi?.downloads?.last_month != null) pkg.downloads = s.pypi.downloads.last_month;
    pkg._stats = s;  // full stats attached for rich rendering
  });
}

/* ── Fit Score Ranking ────────────────────────────────────── */

/**
 * Compute the "fit score" for every package and attach scores as
 * private properties (_fitTotal, _fitStars, _fitDownloads, _fitUc).
 *
 * Formula (each sub-score 0–100, equal weight 1/3):
 *   stars_score     = log(stars + 1)     / log(maxStars + 1)     × 100  (log scale)
 *   downloads_score = log(downloads + 1) / log(maxDownloads + 1) × 100  (log scale)
 *   uc_score        = useCasesCount / maxUseCasesCount            × 100  (linear)
 *
 * Normalisation is relative to the best package in the ecosystem catalog
 * (scikit-learn core is shown separately as the hero card and excluded).
 *
 * Editorial boost: packages where (probabl === true && scope === 'core') receive a flat
 * +100 added to _fitTotal only. This guarantees Probabl core libraries always sort above
 * the general ecosystem under the default fit-score ranking. The boost is intentional and
 * disclosed in the card tooltip. _fitBase is NEVER modified and is the only value shown
 * in the UI.
 */
function computeFitScores() {
  const pkgs = catalog.packages;
  const maxStars     = Math.max(...pkgs.map(p => p.stars     ?? 0), 1);
  const maxDownloads = Math.max(...pkgs.map(p => p.downloads ?? 0), 1);

  const ucCounts = pkgs.map(p =>
    useCases ? useCases.use_cases.filter(uc => uc.packages.includes(p.id)).length : 0
  );
  const maxUc = Math.max(...ucCounts, 1);

  pkgs.forEach((p, i) => {
    p._fitStars     = Math.log((p.stars     ?? 0) + 1) / Math.log(maxStars     + 1) * 100;
    p._fitDownloads = Math.log((p.downloads ?? 0) + 1) / Math.log(maxDownloads + 1) * 100;
    p._fitUc        = (ucCounts[i] / maxUc) * 100;
    p._fitBase      = (p._fitStars + p._fitDownloads + p._fitUc) / 3;
    // Editorial boost (+100 to _fitTotal, not _fitBase): applied only to packages where
    // probabl === true AND scope === 'core' (Probabl core libraries). This pins them above
    // all ecosystem packages in the default fit-score sort. _fitBase is unchanged and is
    // the only score shown in the UI — the boost never appears in any displayed number.
    p._fitTotal     = p._fitBase + ((p.probabl && p.scope === 'core') ? 100 : 0);
  });
}

/* ═══════════════════════════════════════════════════════════
   VIEW SWITCHING
   ═══════════════════════════════════════════════════════════ */

function switchView(view) {
  state.view = view;
  history.replaceState(null, '', '#' + view);
  closeAllDropdowns();

  // Tabs
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('is-active', t.dataset.view === view));

  // Filter bars
  document.getElementById('catalog-filter-bar').style.display = view === 'catalog'    ? '' : 'none';
  document.getElementById('uc-filter-bar').style.display      = view === 'use-cases'  ? '' : 'none';

  // Content views
  document.getElementById('view-releases').style.display   = view === 'releases'   ? '' : 'none';
  document.getElementById('view-catalog').style.display    = view === 'catalog'    ? '' : 'none';
  document.getElementById('view-use-cases').style.display  = view === 'use-cases'  ? '' : 'none';
  document.getElementById('view-about').style.display      = view === 'about'      ? '' : 'none';

  // Context-aware submit button
  const label = document.getElementById('btn-submit-label');
  const labelMap = { releases: 'Contribute', catalog: 'Submit Package', 'use-cases': 'Submit Use Case', about: 'Submit Feedback' };
  if (label) label.textContent = labelMap[view] || 'Submit Package';
}

function setTabCount(view, n) {
  const el = document.querySelector(`.view-tab[data-view="${view}"] .view-tab__count`);
  if (el) el.textContent = n;
}

/* ═══════════════════════════════════════════════════════════
   DROPDOWN FILTER PILLS
   ═══════════════════════════════════════════════════════════ */

function closeAllDropdowns() {
  document.querySelectorAll('.filter-panel.is-open').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.filter-btn.is-open').forEach(b => b.classList.remove('is-open'));
}

function toggleDropdown(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const btn   = group.querySelector('.filter-btn');
  const panel = group.querySelector('.filter-panel');
  const wasOpen = panel.classList.contains('is-open');

  closeAllDropdowns();

  if (!wasOpen) {
    panel.classList.add('is-open');
    btn.classList.add('is-open');
  }
}

/** Update a filter button's active badge count. */
function updateFilterBtnState(groupId, stateSet) {
  const group  = document.getElementById(groupId);
  if (!group) return;
  const btn    = group.querySelector('.filter-btn');
  const badge  = group.querySelector('.filter-btn__badge');
  const n      = stateSet.size;
  btn.classList.toggle('has-active', n > 0);
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'inline-flex' : 'none'; }
}

function updateAllCatalogBtns() {
  updateFilterBtnState('fg-nature',  state.nature);
  updateFilterBtnState('fg-scope',   state.scope);
  updateFilterBtnState('fg-license', state.license);
  const hasAny = state.search || state.nature.size || state.scope.size || state.license.size;
  const clearBtn = document.getElementById('catalog-clear-btn');
  if (clearBtn) clearBtn.classList.toggle('is-visible', !!hasAny);
}

function updateAllUcBtns() {
  updateFilterBtnState('fg-industry',  state.industry);
  updateFilterBtnState('fg-technique', state.technique);
  updateFilterBtnState('fg-difficulty',state.difficulty);
  const hasAny = state.ucSearch || state.industry.size || state.technique.size || state.difficulty.size;
  const clearBtn = document.getElementById('uc-clear-btn');
  if (clearBtn) clearBtn.classList.toggle('is-visible', !!hasAny);
}

/* ═══════════════════════════════════════════════════════════
   CATALOG: FILTER-PANEL COUNTS
   ═══════════════════════════════════════════════════════════ */

function populateCatalogCounts() {
  const all = catalog.packages;
  const set = (key, val) => {
    const el = document.querySelector(`[data-count="${key}:${val}"]`);
    if (el) el.textContent = all.filter(p => p[key] === val).length;
  };
  ['library','extension','application'].forEach(v => set('nature', v));
  ['core','incremental','verticalized'].forEach(v => set('scope', v));
  ['MIT','BSD-3-Clause','BSD-2-Clause','Apache-2.0','GPL-3.0'].forEach(v => set('license', v));
}

function populateUcCounts() {
  const all = useCases.use_cases;
  const set = (key, val) => {
    const el = document.querySelector(`[data-uc-count="${key}:${val}"]`);
    if (el) el.textContent = all.filter(uc => Array.isArray(uc[key]) ? uc[key].includes(val) : uc[key] === val).length;
  };
  ['banking','insurance','healthcare','retail','e-commerce','manufacturing','telecom',
   'energy','logistics','hr','marketing','real-estate','cybersecurity','agriculture'].forEach(v => set('industry', v));
  ['fraud-detection','churn-prediction','credit-scoring','predictive-maintenance','recommendation',
   'demand-forecasting','anomaly-detection','customer-segmentation','sentiment-analysis',
   'survival-analysis','time-series','classification','regression','clustering','nlp',
   'explainability','price-optimization'].forEach(v => set('technique', v));
  ['beginner','intermediate','advanced'].forEach(v => set('difficulty', v));
}

/* ═══════════════════════════════════════════════════════════
   CATALOG HERO
   ═══════════════════════════════════════════════════════════ */

function renderCatalogHero() {
  const c = catalog.core;
  const s = c._stats;  // live stats object (may be undefined before stats.json loads)

  // Prefer live values from stats.json; fall back gracefully
  const version    = s?.pypi?.version ?? null;
  const stars      = c.stars     ?? null;
  const downloads  = c.downloads ?? null;
  const forks      = s?.github?.forks ?? null;
  const lastCommit = s?.github?.last_commit
    ? new Date(s.github.last_commit).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null;

  const ucCount = useCases
    ? useCases.use_cases.filter(uc => uc.packages.includes('scikit-learn')).length : 0;

  document.getElementById('sklearn-hero').innerHTML = `
    <div class="sklearn-hero__corner-tag">★ The Core</div>
    <div class="sklearn-hero__body">
      <div class="sklearn-hero__logo">
        <img src="https://scikit-learn.org/stable/_static/scikit-learn-logo-notext.png" alt="scikit-learn logo"
          onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg';">
      </div>
      <div class="sklearn-hero__content">
        <div class="sklearn-hero__pill">★ Core Library — Foundation of the Ecosystem</div>
        <div class="sklearn-hero__name">${c.name}</div>
        <p class="sklearn-hero__description">${c.description}</p>
        <div class="sklearn-hero__badges badges">
          <span class="badge">Library</span><span class="badge badge--core">Core</span>
          <span class="badge badge--license">${c.license}</span>
          ${version ? `<span class="badge">v${version}</span>` : ''}
        </div>
        <div class="sklearn-hero__compat">
          <span class="sklearn-hero__compat-pill">✓ Provides Estimators</span>
          <span class="sklearn-hero__compat-pill">✓ Consumes Estimators</span>
        </div>
        <div class="sklearn-hero__stats">
          ${stars     != null ? `<span class="sklearn-hero__stat"><i class="fas fa-star"></i> ${fmt(stars)} stars</span>` : ''}
          ${forks     != null ? `<span class="sklearn-hero__stat"><i class="fas fa-code-branch"></i> ${fmt(forks)} forks</span>` : ''}
          ${downloads != null ? `<span class="sklearn-hero__stat"><i class="fas fa-download"></i> ${fmt(downloads)}/month</span>` : ''}
          <span class="sklearn-hero__stat"><i class="fas fa-users"></i> ${fmt(c.contributors_count)}+ contributors</span>
          ${lastCommit ? `<span class="sklearn-hero__stat"><i class="fas fa-code-commit"></i> Last commit ${lastCommit}</span>` : ''}
          ${ucCount ? `<span class="sklearn-hero__stat" style="cursor:pointer" onclick="filterUcByPackage('scikit-learn')">
            <i class="fas fa-lightbulb"></i> ${ucCount} use cases</span>` : ''}
        </div>
        <div class="sklearn-hero__links">
          <a href="${c.website}" target="_blank" class="sklearn-hero__link sklearn-hero__link--filled"><i class="fas fa-globe"></i> Homepage</a>
          <a href="${c.repository}" target="_blank" class="sklearn-hero__link"><i class="fab fa-github"></i> Repo</a>
          <a href="${c.docs}" target="_blank" class="sklearn-hero__link"><i class="fas fa-book"></i> Docs</a>
          <span class="sklearn-hero__link" style="cursor:default;opacity:.7;text-transform:none;"><i class="fas fa-terminal"></i> pip install ${c.pypi_name}</span>
        </div>
      </div>
    </div>`;
}

/* ── Catalog render ─────────────────────────────────────── */
function renderCatalogAll() {
  const filtered = applyFilters();
  renderCatalogActiveFilters();
  const el = document.getElementById('result-count');
  if (el) el.textContent = `${filtered.length} package${filtered.length !== 1 ? 's' : ''}`;
  renderCards(filtered);
  updateAllCatalogBtns();
}

function applyFilters() {
  let r = [...catalog.packages]; // archived already excluded at load time
  if (state.search) {
    const q = state.search.toLowerCase();
    r = r.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) || (p.pypi_name||'').toLowerCase().includes(q));
  }
  if (state.nature.size)  r = r.filter(p => state.nature.has(p.nature));
  if (state.scope.size)   r = r.filter(p => state.scope.has(p.scope));
  if (state.license.size) r = r.filter(p => state.license.has(p.license));
  r.sort((a, b) => {
    if (state.sortBy === 'name')      return a.name.localeCompare(b.name);
    if (state.sortBy === 'stars')     return (b.stars ?? 0) - (a.stars ?? 0);
    if (state.sortBy === 'downloads') return (b.downloads ?? 0) - (a.downloads ?? 0);
    return (b._fitTotal ?? 0) - (a._fitTotal ?? 0);  // default: fit score ranking
  });
  return r;
}

function renderCatalogActiveFilters() {
  const container = document.getElementById('active-filters');
  if (!container) return;
  const tags = [];
  const add = (set, prefix) => set.forEach(v =>
    tags.push(`<span class="active-filter-tag" data-filter="${prefix}:${v}">${v} <span class="active-filter-tag__remove">✕</span></span>`)
  );
  if (state.search) tags.push(`<span class="active-filter-tag" data-filter="search:">"${state.search}" <span class="active-filter-tag__remove">✕</span></span>`);
  add(state.nature, 'nature'); add(state.scope, 'scope'); add(state.license, 'license');
  container.innerHTML = tags.join('');
  container.classList.toggle('is-visible', tags.length > 0);
}

function renderCards(packages) {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  if (!packages.length) {
    grid.innerHTML = `<div class="state-empty"><div class="state-empty__icon">🔭</div>
      <div class="state-empty__title">No packages found</div>
      <p class="state-empty__subtitle">Try different search terms or reset your filters.</p>
      <button class="btn btn--outline" onclick="resetFilters()">Reset Filters</button></div>`;
    return;
  }
  grid.innerHTML = packages.map(renderCard).join('');
}

function renderCard(pkg) {
  const pcls  = pkg.provides_estimators ? 'compat-pill--yes' : 'compat-pill--no';
  const ccls  = pkg.consumes_estimators ? 'compat-pill--yes' : 'compat-pill--no';
  const scope = { core:'badge--core', incremental:'badge--incremental', verticalized:'badge--verticalized' };
  const natur = { library:'badge--library', extension:'badge--extension', application:'badge--application' };

  const links = [
    pkg.website    && `<a href="${pkg.website}" target="_blank" class="card__link">Homepage</a>`,
    pkg.repository && `<a href="${pkg.repository}" target="_blank" class="card__link"><i class="fab fa-github"></i> Repo</a>`,
    pkg.docs       && `<a href="${pkg.docs}" target="_blank" class="card__link"><i class="fas fa-book"></i> Docs</a>`,
  ].filter(Boolean).join('');

  const tags = pkg.tags?.length
    ? `<div class="tag-row">${pkg.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';

  const install = pkg.pypi_name
    ? `<div class="card__install" onclick="copyInstall('${pkg.pypi_name}',this)">
        <i class="fas fa-terminal"></i><span>pip install ${pkg.pypi_name}</span><i class="fas fa-copy"></i></div>` : '';

  const ucCount = useCases ? useCases.use_cases.filter(uc => uc.packages.includes(pkg.id)).length : 0;
  const ucLink = ucCount
    ? `<span class="card__use-cases" onclick="filterUcByPackage('${pkg.id}')">
        <i class="fas fa-lightbulb"></i> ${ucCount} use case${ucCount !== 1 ? 's' : ''}</span>` : '';

  const rankChip = pkg._fitTotal != null ? renderRankChip(pkg) : '';

  // Live version badge from stats.json
  const version = pkg._stats?.pypi?.version;
  const versionBadge = version ? `<span class="badge badge--version">v${version}</span>` : '';

  return `
    <article class="card" data-id="${pkg.id}">
      ${rankChip}
      <div class="card__name">${pkg.name}</div>
      <div class="badges">
        <span class="badge ${natur[pkg.nature]||''}">${pkg.nature}</span>
        <span class="badge ${scope[pkg.scope]||''}">${pkg.scope}</span>
        <span class="badge badge--license">${pkg.license}</span>
        ${versionBadge}
      </div>
      <p class="card__description">${pkg.description}</p>
      <div class="compat-row">
        <span class="compat-pill ${pcls}">${pkg.provides_estimators?'✓':'✗'} Provides Estimators</span>
        <span class="compat-pill ${ccls}">${pkg.consumes_estimators?'✓':'✗'} Consumes Estimators</span>
      </div>
      <div class="card__stats">
        <span class="card__stat"><i class="fas fa-star"></i> ${fmt(pkg.stars)}</span>
        <span class="card__stat"><i class="fas fa-download"></i> ${fmt(pkg.downloads)}/mo</span>
        ${ucLink}
      </div>
      ${tags}${install}
      <div class="card__links">${links}</div>
    </article>`;
}

/**
 * Render the fit score chip (top-right of card) with a hover tooltip
 * that shows the three sub-scores as progress bars.
 */
function renderRankChip(pkg) {
  // Show branded badge only for Probabl core packages (probabl && scope === 'core') in fit-score sort
  if (pkg.probabl && pkg.scope === 'core' && state.sortBy === 'ranking') {
    const stars = Math.round(pkg._fitStars);
    const dl    = Math.round(pkg._fitDownloads);
    const uc    = Math.round(pkg._fitUc);
    const bar = (pct) =>
      `<div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" style="width:${pct}%"></div></div>`;
    return `
      <div class="card__ranking card__ranking--probabl">
        <svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Featured by Probabl">
          <circle cx="200" cy="200" r="200" fill="#1E22AA"/>
          <path d="M110.452 145.278H141.492C144.142 145.278 145.278 144.142 145.278 141.493V110.452C145.278 107.803 144.142 106.667 141.492 106.667H110.452C107.802 106.667 106.667 107.803 106.667 110.452V141.493C106.667 144.142 107.802 145.278 110.452 145.278Z" fill="#F68D2E"/>
          <path d="M110.452 292.001H141.492C144.142 292.001 145.278 290.865 145.278 288.215V257.175C145.278 254.525 144.142 253.39 141.492 253.39H110.452C107.802 253.39 106.667 254.525 106.667 257.175V288.215C106.667 290.865 107.802 292.001 110.452 292.001Z" fill="#F68D2E"/>
          <path d="M257.174 292.001H288.214C290.864 292.001 292 290.865 292 288.215V257.175C292 254.525 290.864 253.39 288.214 253.39H257.174C254.524 253.39 253.389 254.525 253.389 257.175V288.215C253.389 290.865 254.524 292.001 257.174 292.001Z" fill="#F68D2E"/>
        </svg>
        <div class="ranking-tooltip ranking-tooltip--probabl">
          <div class="ranking-tooltip__title">Featured by :probabl.</div>
          <p class="ranking-tooltip__probabl-body">A core project of Probabl, the company behind scikit-learn. It is editorially pinned at the top of the Fit Score ranking — the score shown (stars · downloads · use cases) does not include the ranking boost.</p>
          <div class="ranking-tooltip__divider"></div>
          <div class="ranking-tooltip__title ranking-tooltip__title--fitscore">Fit Score</div>
          <div class="ranking-tooltip__row">
            <span class="ranking-tooltip__label"><i class="fas fa-star"></i> Stars</span>
            ${bar(stars)}
            <span class="ranking-tooltip__val">${stars}</span>
          </div>
          <div class="ranking-tooltip__row">
            <span class="ranking-tooltip__label"><i class="fas fa-download"></i> Downloads</span>
            ${bar(dl)}
            <span class="ranking-tooltip__val">${dl}</span>
          </div>
          <div class="ranking-tooltip__row">
            <span class="ranking-tooltip__label"><i class="fas fa-lightbulb"></i> Use Cases</span>
            ${bar(uc)}
            <span class="ranking-tooltip__val">${uc}</span>
          </div>
        </div>
      </div>`;
  }

  // Default: numeric fit score chip (use _fitBase so probabl boost never leaks into display)
  const total = Math.round(pkg._fitBase ?? pkg._fitTotal);
  const stars = Math.round(pkg._fitStars);
  const dl    = Math.round(pkg._fitDownloads);
  const uc    = Math.round(pkg._fitUc);

  const bar = (pct) =>
    `<div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" style="width:${pct}%"></div></div>`;

  return `
    <div class="card__ranking">
      ${total}
      <div class="ranking-tooltip">
        <div class="ranking-tooltip__title">Fit Score</div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-star"></i> Stars</span>
          ${bar(stars)}
          <span class="ranking-tooltip__val">${stars}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-download"></i> Downloads</span>
          ${bar(dl)}
          <span class="ranking-tooltip__val">${dl}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-lightbulb"></i> Use Cases</span>
          ${bar(uc)}
          <span class="ranking-tooltip__val">${uc}</span>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   USE-CASES VIEW
   ═══════════════════════════════════════════════════════════ */

function renderUcAll() {
  if (!useCases) return;
  const filtered = applyUcFilters();
  renderUcActiveFilters();
  const el = document.getElementById('uc-result-count');
  if (el) el.textContent = `${filtered.length} use case${filtered.length !== 1 ? 's' : ''}`;
  renderUcGrid(filtered);
  updateAllUcBtns();
}

function applyUcFilters() {
  let r = [...useCases.use_cases];
  if (state.ucSearch) {
    const q = state.ucSearch.toLowerCase();
    r = r.filter(uc => uc.title.toLowerCase().includes(q) || uc.synopsis.toLowerCase().includes(q) ||
      uc.industry.some(i => i.includes(q)) || uc.technique.some(t => t.includes(q)) || uc.packages.some(p => p.includes(q)));
  }
  if (state.industry.size)   r = r.filter(uc => uc.industry.some(i => state.industry.has(i)));
  if (state.technique.size)  r = r.filter(uc => uc.technique.some(t => state.technique.has(t)));
  if (state.difficulty.size) r = r.filter(uc => state.difficulty.has(uc.difficulty));
  return r;
}

function renderUcGrid(items) {
  const grid = document.getElementById('uc-grid');
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div class="state-empty"><div class="state-empty__icon">🔬</div>
      <div class="state-empty__title">No use cases found</div>
      <p class="state-empty__subtitle">Try different filters or search terms.</p>
      <button class="btn btn--outline" onclick="resetUcFilters()">Reset Filters</button></div>`;
    return;
  }
  grid.innerHTML = items.map(renderUcCard).join('');
}

function renderUcCard(uc) {
  const industryTags = uc.industry.map(i =>
    `<span class="industry-tag" onclick="filterByIndustry('${i}')">${i}</span>`).join('');
  const techTags = uc.technique.map(t =>
    `<span class="technique-tag" onclick="filterByTechnique('${t}')">${t.replace(/-/g,' ')}</span>`).join('');
  const pkgChips = uc.packages.map(pid => {
    const isSk = pid === 'scikit-learn';
    return `<span class="uc-package-chip${isSk?' uc-package-chip--core':''}" onclick="viewPackageInCatalog('${pid}')" title="View in catalog">${pid}</span>`;
  }).join('');

  const githubUrl = `https://github.com/probabl-ai/scikit-learn-central/blob/main/data/use-cases/${uc.uuid}.py`;

  return `
    <article class="uc-card" data-uc-id="${uc.slug}">
      <div class="uc-card__difficulty"><span class="difficulty-badge difficulty-badge--${uc.difficulty}">${uc.difficulty}</span></div>
      <div class="uc-card__title">${uc.title}</div>
      <p class="uc-card__synopsis" onclick="this.classList.toggle('is-expanded')">${uc.synopsis}</p>
      <div class="uc-card__tags">${industryTags}${techTags}</div>
      <div class="uc-card__packages">${pkgChips}</div>
      <div class="uc-card__footer">
        <button class="uc-card__copy-link" onclick="copyUseCaseLink('${uc.slug}')" title="Copy link to this use case"><i class="fas fa-link"></i> Copy link</button>
        <a href="${githubUrl}" target="_blank" rel="noopener" class="btn--github-square" title="View on GitHub"><i class="fab fa-github"></i></a>
        <button class="btn--view-code" onclick="openCodeModal('${uc.slug}')"><i class="fas fa-code"></i> View Code</button>
      </div>
    </article>`;
}

function renderUcActiveFilters() {
  const container = document.getElementById('uc-active-filters');
  if (!container) return;
  const tags = [];
  const add = (set, prefix) => set.forEach(v =>
    tags.push(`<span class="active-filter-tag" data-uc-filter="${prefix}:${v}">${v} <span class="active-filter-tag__remove">✕</span></span>`)
  );
  if (state.ucSearch) tags.push(`<span class="active-filter-tag" data-uc-filter="search:">"${state.ucSearch}" <span class="active-filter-tag__remove">✕</span></span>`);
  add(state.industry, 'industry'); add(state.technique, 'technique'); add(state.difficulty, 'difficulty');
  container.innerHTML = tags.join('');
  container.classList.toggle('is-visible', tags.length > 0);
}

/* ═══════════════════════════════════════════════════════════
   CODE MODAL
   ═══════════════════════════════════════════════════════════ */

async function openCodeModal(ucSlug) {
  const uc = useCases?.use_cases.find(u => u.slug === ucSlug);
  if (!uc) return;

  document.getElementById('code-modal-title').textContent = uc.title;
  document.getElementById('code-modal-synopsis').textContent = uc.synopsis;

  // Set GitHub link
  const githubBtn = document.getElementById('btn-github-code');
  if (githubBtn) {
    githubBtn.href = `https://github.com/probabl-ai/scikit-learn-central/blob/main/data/use-cases/${uc.uuid}.py`;
  }

  const metaEl = document.getElementById('code-modal-meta');
  if (metaEl) {
    metaEl.innerHTML =
      `<span class="difficulty-badge difficulty-badge--${uc.difficulty}">${uc.difficulty}</span>` +
      uc.industry.map(i => `<span class="industry-tag">${i}</span>`).join('') +
      uc.technique.map(t => `<span class="technique-tag">${t.replace(/-/g,' ')}</span>`).join('');
  }

  const pkgEl = document.getElementById('code-modal-packages');
  if (pkgEl) {
    pkgEl.innerHTML = uc.packages.map(pid =>
      `<span class="uc-package-chip${pid==='scikit-learn'?' uc-package-chip--core':''}">${pid}</span>`
    ).join('');
  }

  // Show modal immediately with a loading placeholder in the code block
  const pre = document.getElementById('code-modal-pre');
  if (pre) { pre.textContent = 'Loading…'; pre.removeAttribute('data-highlighted'); }
  document.getElementById('code-modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Lazily fetch the .py file — only now, when the user has asked for it
  const code = await fetchText(`data/use-cases/${uc.uuid}.py`);
  if (pre) {
    pre.textContent = code ?? '# Code not available.';
    if (window.hljs) { pre.removeAttribute('data-highlighted'); window.hljs.highlightElement(pre); }
  }
}

function closeCodeModal() {
  document.getElementById('code-modal-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
}

window.copyCode = function(el) {
  const pre = document.getElementById('code-modal-pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    el.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => { el.innerHTML = '<i class="fas fa-copy"></i> Copy Code'; }, 2000);
  });
};

/* ═══════════════════════════════════════════════════════════
   SUBMISSION MODALS
   ═══════════════════════════════════════════════════════════ */

function openPackageModal() {
  document.getElementById('modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closePackageModal() {
  document.getElementById('modal-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
}

function openUcModal() {
  document.getElementById('uc-modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeUcModal() {
  document.getElementById('uc-modal-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
}

function openFeedbackModal() {
  document.getElementById('feedback-modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
  document.getElementById('feedback-modal-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ── Form submission helpers ─────────────────────────────── */

const WEBHOOK_URL = 'https://probabl.app.n8n.cloud/webhook/7a6c6cfb-0631-4f86-80bc-80f29691372b';

/** Strip HTML tags and trim; cap at maxLen characters. */
function sanitizeText(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

/** POST a JSON payload to the webhook. Throws on network or HTTP errors. */
async function postToWebhook(payload) {
  const r = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

/** Replace form body with a success message. */
function showFormSuccess(form, emoji, heading, body, closeCallback) {
  form.innerHTML = `<div style="text-align:center;padding:var(--space-8)">
    <div style="font-size:2rem;margin-bottom:var(--space-4)">${emoji}</div>
    <div style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--probabl-blue)">${heading}</div>
    <p style="color:var(--neutral-600);margin-top:var(--space-3)">${body}</p>
    <button class="btn btn--primary" style="margin-top:var(--space-6)" onclick="${closeCallback}()">Close</button>
  </div>`;
}

/** Show an inline error notice at the bottom of the form and re-enable the submit button. */
function showFormError(form, submitBtn) {
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
  let errEl = form.querySelector('.form-submit-error');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.className = 'form-submit-error';
    errEl.style.cssText = 'color:#c2640a;font-size:var(--text-sm);margin-top:var(--space-3);text-align:center';
    form.querySelector('.modal__footer')?.before(errEl);
  }
  errEl.textContent = 'Something went wrong. Please try again.';
}

/** Set submit button to a loading state. */
function setSubmitting(btn) {
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
}

/* ── Form handlers ───────────────────────────────────────── */

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const form      = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const type    = sanitizeText(form.querySelector('[name="type"]')?.value);
  const message = sanitizeText(form.querySelector('[name="message"]')?.value);
  if (!type || !message) return;

  setSubmitting(submitBtn);
  try {
    await postToWebhook({ form_name: 'feedback', type, message });
    showFormSuccess(form, '🙏', 'Thank you!', 'Your feedback has been received.', 'closeFeedbackModal');
  } catch (_) {
    showFormError(form, submitBtn);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form      = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const name        = sanitizeText(form.querySelector('[name="name"]')?.value);
  const pypi_name   = sanitizeText(form.querySelector('[name="pypi_name"]')?.value);
  const repository  = sanitizeText(form.querySelector('[name="repository"]')?.value);
  const description = sanitizeText(form.querySelector('[name="description"]')?.value);
  if (!name || !pypi_name || !repository) return;

  setSubmitting(submitBtn);
  try {
    await postToWebhook({ form_name: 'submit_package', name, pypi_name, repository, description });
    showFormSuccess(form, '🎉', 'Thank you!',
      `We received your submission for <strong>${name}</strong>.`,
      'closePackageModal');
  } catch (_) {
    showFormError(form, submitBtn);
  }
}

async function handleUcSubmit(e) {
  e.preventDefault();
  const form      = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const title       = sanitizeText(form.querySelector('[name="title"]')?.value);
  const industry    = sanitizeText(form.querySelector('[name="industry"]')?.value);
  const technique   = sanitizeText(form.querySelector('[name="technique"]')?.value);
  const packages    = sanitizeText(form.querySelector('[name="packages"]')?.value);
  const synopsis    = sanitizeText(form.querySelector('[name="synopsis"]')?.value);
  const sample_code = sanitizeText(form.querySelector('[name="sample_code"]')?.value, 10000);
  if (!title || !industry || !technique || !packages || !synopsis) return;

  setSubmitting(submitBtn);
  try {
    await postToWebhook({ form_name: 'submit_use_case', title, industry, technique, packages, synopsis, sample_code });
    showFormSuccess(form, '🎉', 'Thank you!',
      `We received your use case: <strong>${title}</strong>.`,
      'closeUcModal');
  } catch (_) {
    showFormError(form, submitBtn);
  }
}

/* ═══════════════════════════════════════════════════════════
   CROSS-LINKING
   ═══════════════════════════════════════════════════════════ */

window.filterUcByPackage = function(pkgId) {
  state.ucSearch = pkgId;
  const el = document.getElementById('uc-search-input'); if (el) el.value = pkgId;
  state.industry.clear(); state.technique.clear(); state.difficulty.clear();
  document.querySelectorAll('.uc-filter-option input').forEach(cb => cb.checked = false);
  switchView('use-cases');
  renderUcAll();
};

window.viewPackageInCatalog = function(pkgId) {
  state.search = pkgId;
  const el = document.getElementById('search-input'); if (el) el.value = pkgId;
  state.nature.clear(); state.scope.clear(); state.license.clear();
  document.querySelectorAll('.filter-option input').forEach(cb => cb.checked = false);
  switchView('catalog');
  renderCatalogAll();
  setTimeout(() => {
    const card = document.querySelector(`.card[data-id="${pkgId}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

window.filterByIndustry = function(industry) {
  state.industry.clear(); state.industry.add(industry);
  document.querySelectorAll('.uc-filter-option input[data-uc-filter-key="industry"]').forEach(cb => {
    cb.checked = cb.dataset.ucFilterVal === industry;
  });
  renderUcAll();
};

window.filterByTechnique = function(technique) {
  state.technique.clear(); state.technique.add(technique);
  document.querySelectorAll('.uc-filter-option input[data-uc-filter-key="technique"]').forEach(cb => {
    cb.checked = cb.dataset.ucFilterVal === technique;
  });
  renderUcAll();
};

/* ═══════════════════════════════════════════════════════════
   RELEASES RENDERING
   ═══════════════════════════════════════════════════════════ */

function compareVersions(a, b) {
  // 'future' always sorts first
  if (a.version === 'future') return -1;
  if (b.version === 'future') return 1;
  const pa = a.version.split('.').map(Number);
  const pb = b.version.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function renderReleasesAll() {
  const grid = document.getElementById('releases-grid');
  if (!releases?.releases || !grid) return;
  const sorted = [...releases.releases].sort(compareVersions);
  grid.innerHTML = sorted.map(renderReleaseCard).join('');
  renderReleasesBlogStrip();
}

const TAG_CONFIG = [
  { key: 'major_feature', label: 'Major',   cssClass: 'major-feature' },
  { key: 'feature',       label: 'Feature', cssClass: 'feature'       },
  { key: 'efficiency',    label: 'Perf',    cssClass: 'efficiency'    },
  { key: 'enhancement',   label: 'Enh',     cssClass: 'enhancement'   },
  { key: 'fix',           label: 'Fix',     cssClass: 'fix'           },
  { key: 'api_change',    label: 'API',     cssClass: 'api-change'    },
];

function renderReleaseStats(rel) {
  const s = rel.stats;
  if (!s || !s.tag_counts) return '';

  const tc = s.tag_counts;
  const total = Object.values(tc).reduce((a, b) => a + b, 0);
  if (total === 0 && !s.contributor_count) return '';

  const barSegments = total > 0
    ? TAG_CONFIG
        .filter(t => tc[t.key] > 0)
        .map(t => {
          const pct      = (tc[t.key] / total * 100).toFixed(2);
          const fullLabel = t.key.replace(/_/g, ' ');
          return `<div class="release-stats-bar__seg release-stats-bar__seg--${t.cssClass}"
                       style="width:${pct}%"
                       title="${tc[t.key]} ${fullLabel}"></div>`;
        }).join('')
    : '';

  const bar = total > 0
    ? `<div class="release-stats-bar" title="${total} changelog entries">${barSegments}</div>`
    : '';

  const tagPills = TAG_CONFIG
    .filter(t => tc[t.key] > 0)
    .map(t => `<span class="release-stats-pill release-stats-pill--${t.cssClass}"
                     title="${tc[t.key]} ${t.key.replace(/_/g, ' ')}">${tc[t.key]} ${t.label}</span>`)
    .join('');

  const contribPill = s.contributor_count
    ? `<span class="release-stats-pill release-stats-pill--contributors"
               title="${s.contributor_count} contributors">
         <i class="fas fa-users"></i> ${s.contributor_count}
       </span>`
    : '';

  return `<div class="release-card__stats">
      <div class="release-stats-pills">${tagPills}${contribPill}</div>
      ${bar}
    </div>`;
}

function renderReleaseCard(rel) {
  const isFuture   = rel.version === 'future';
  const versionLabel = isFuture ? 'FUTURE RELEASE' : `v${rel.version}`;
  const dateLabel    = rel.date
    ? new Date(rel.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Upcoming';

  const versionEl = rel.github_url
    ? `<a href="${rel.github_url}" target="_blank" rel="noopener" class="release-card__version-link">${versionLabel}</a>`
    : `<span class="release-card__version-link">${versionLabel}</span>`;

  const highlights = (rel.highlights || []).map(h => {
    // h can be { text, github_issue_url, reaction_count } or a plain string (legacy)
    const text     = typeof h === 'string' ? h : h.text;
    const issueUrl = typeof h === 'object' ? h.github_issue_url : null;
    const count    = typeof h === 'object' ? h.reaction_count   : null;

    let voteHtml = '';
    if (issueUrl) {
      const countStr = count != null ? fmt(count) : '';
      voteHtml = `<a href="${issueUrl}" target="_blank" rel="noopener"
                     class="release-highlight__vote" title="Vote on GitHub (👍 this issue)">
                    <i class="fas fa-thumbs-up"></i>${countStr ? `<span>${countStr}</span>` : ''}
                  </a>`;
    }
    return `<li class="release-highlight">${text}${voteHtml}</li>`;
  }).join('');

  const releaseNotesBtn = rel.release_notes_url
    ? `<a href="${rel.release_notes_url}" target="_blank" rel="noopener"
          class="btn btn--sm ${isFuture ? 'btn--outline-white' : 'btn--outline-blue'}">
         RELEASE NOTES
       </a>`
    : '';

  const ctaBtn = isFuture
    ? `<a href="https://github.com/scikit-learn/scikit-learn/contribute"
          target="_blank" rel="noopener" class="btn btn--sm btn--cta">CONTRIBUTE</a>`
    : `<a href="https://probabl.ai/support?utm_source=skl-central&utm_campaign=get_scikit-learn_support_v${rel.version}"
          target="_blank" rel="noopener" class="btn btn--sm btn--cta">GET SUPPORT</a>`;

  const blogBtns = (rel.blog_posts || []).map(bp =>
    `<a href="${bp.url}" target="_blank" rel="noopener"
        class="btn btn--sm ${isFuture ? 'btn--outline-white' : 'btn--outline-blue'} release-card__blog-btn"
        title="${bp.title}">
       <i class="fas fa-newspaper"></i>
     </a>`
  ).join('');

  const stats = renderReleaseStats(rel);

  return `
    <article class="release-card ${isFuture ? 'release-card--future' : ''}">
      <div class="release-card__header">
        <div class="release-card__version">${versionEl}</div>
        <div class="release-card__date">${dateLabel}</div>
      </div>
      <ul class="release-card__highlights">${highlights}</ul>
      ${stats}
      <div class="release-card__actions">
        ${releaseNotesBtn}
        ${ctaBtn}
        ${blogBtns}
      </div>
    </article>`;
}

function renderReleasesBlogStrip() {
  const el = document.getElementById('releases-blog-strip');
  if (!el) return;

  // Collect unique blog posts across all releases (deduplicated by URL)
  const seen  = new Set();
  const posts = [];
  releases.releases.forEach(r => {
    (r.blog_posts || []).forEach(bp => {
      if (!seen.has(bp.url)) { seen.add(bp.url); posts.push(bp); }
    });
  });
  if (!posts.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="releases-blog-strip">
      <span class="releases-blog-strip__label"><i class="fas fa-rss"></i> From our blog</span>
      ${posts.map(bp => {
        const d = new Date(bp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        return `<a href="${bp.url}" target="_blank" rel="noopener" class="releases-blog-strip__item">
                  <span class="releases-blog-strip__title">${bp.title}</span>
                  <span class="releases-blog-strip__meta">${bp.author} · ${d}</span>
                </a>`;
      }).join('')}
      <div class="releases-blog-strip__spacer"></div>
      <a href="https://blog.probabl.ai/tag/scikit-learn" target="_blank" rel="noopener"
         class="releases-blog-strip__more">probabl.ai blog →</a>
      <a href="https://blog.scikit-learn.org" target="_blank" rel="noopener"
         class="releases-blog-strip__more">sklearn blog →</a>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   EVENT BINDING
   ═══════════════════════════════════════════════════════════ */

function bindEvents() {

  // ── View tabs ─────────────────────────────────────────── //
  document.querySelectorAll('.view-tab').forEach(tab =>
    tab.addEventListener('click', () => switchView(tab.dataset.view))
  );

  // ── Filter pill dropdowns ─────────────────────────────── //
  document.querySelectorAll('.filter-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleDropdown(btn.dataset.group); });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.filter-group')) closeAllDropdowns();
  });

  // ── Catalog: search ───────────────────────────────────── //
  let catalogTimer;
  document.getElementById('search-input')?.addEventListener('input', e => {
    clearTimeout(catalogTimer);
    catalogTimer = setTimeout(() => { state.search = e.target.value.trim(); renderCatalogAll(); }, 260);
  });

  // ── Catalog: checkboxes ───────────────────────────────── //
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const { filterKey, filterVal } = cb.dataset;
      const set = state[filterKey]; if (!set) return;
      cb.checked ? set.add(filterVal) : set.delete(filterVal);
      renderCatalogAll();
    });
  });

  // ── Catalog: sort ─────────────────────────────────────── //
  document.getElementById('sort-select')?.addEventListener('change', e => {
    state.sortBy = e.target.value; renderCatalogAll();
  });

  // ── Catalog: active chip removal ──────────────────────── //
  document.getElementById('active-filters')?.addEventListener('click', e => {
    const tag = e.target.closest('.active-filter-tag'); if (!tag) return;
    const [key, val] = tag.dataset.filter.split(':');
    if (key === 'search') { state.search = ''; const si = document.getElementById('search-input'); if (si) si.value = ''; }
    else { state[key]?.delete(val); const cb = document.querySelector(`input[data-filter-key="${key}"][data-filter-val="${val}"]`); if (cb) cb.checked = false; }
    renderCatalogAll();
  });

  // ── Catalog: tag click → search ───────────────────────── //
  document.getElementById('catalog-grid')?.addEventListener('click', e => {
    const tag = e.target.closest('.tag'); if (!tag) return;
    state.search = tag.dataset.tag;
    const si = document.getElementById('search-input'); if (si) si.value = state.search;
    renderCatalogAll();
  });

  // ── Use-cases: search ─────────────────────────────────── //
  let ucTimer;
  document.getElementById('uc-search-input')?.addEventListener('input', e => {
    clearTimeout(ucTimer);
    ucTimer = setTimeout(() => { state.ucSearch = e.target.value.trim(); renderUcAll(); }, 260);
  });

  // ── Use-cases: checkboxes ─────────────────────────────── //
  document.querySelectorAll('.uc-filter-option input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const { ucFilterKey, ucFilterVal } = cb.dataset;
      const set = state[ucFilterKey]; if (!set) return;
      cb.checked ? set.add(ucFilterVal) : set.delete(ucFilterVal);
      renderUcAll();
    });
  });

  // ── Use-cases: active chip removal ───────────────────── //
  document.getElementById('uc-active-filters')?.addEventListener('click', e => {
    const tag = e.target.closest('.active-filter-tag'); if (!tag) return;
    const [key, val] = tag.dataset.ucFilter.split(':');
    if (key === 'search') { state.ucSearch = ''; const si = document.getElementById('uc-search-input'); if (si) si.value = ''; }
    else { state[key]?.delete(val); const cb = document.querySelector(`input[data-uc-filter-key="${key}"][data-uc-filter-val="${val}"]`); if (cb) cb.checked = false; }
    renderUcAll();
  });

  // ── Context-aware submit button ───────────────────────── //
  document.getElementById('btn-submit')?.addEventListener('click', () => {
    if (state.view === 'releases')   window.open('https://github.com/scikit-learn/scikit-learn/contribute', '_blank');
    else if (state.view === 'catalog') openPackageModal();
    else if (state.view === 'use-cases') openUcModal();
    else openFeedbackModal();
  });

  // ── Package modal ─────────────────────────────────────── //
  document.querySelectorAll('#modal-backdrop .modal__close').forEach(btn => btn.addEventListener('click', closePackageModal));
  document.getElementById('package-modal-cancel')?.addEventListener('click', closePackageModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closePackageModal(); });
  document.getElementById('submission-form')?.addEventListener('submit', handleSubmit);

  // ── Use-case modal ────────────────────────────────────── //
  document.querySelectorAll('#uc-modal-backdrop .modal__close').forEach(btn => btn.addEventListener('click', closeUcModal));
  document.getElementById('uc-modal-cancel')?.addEventListener('click', closeUcModal);
  document.getElementById('uc-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'uc-modal-backdrop') closeUcModal(); });
  document.getElementById('uc-submission-form')?.addEventListener('submit', handleUcSubmit);

  // ── Code modal ────────────────────────────────────────── //
  document.getElementById('code-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'code-modal-backdrop') closeCodeModal(); });
  document.querySelectorAll('.code-modal__close').forEach(btn => btn.addEventListener('click', closeCodeModal));

  // ── Feedback modal ────────────────────────────────────── //
  document.getElementById('feedback-modal-close')?.addEventListener('click', closeFeedbackModal);
  document.getElementById('feedback-modal-cancel')?.addEventListener('click', closeFeedbackModal);
  document.getElementById('feedback-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'feedback-modal-backdrop') closeFeedbackModal(); });
  document.getElementById('feedback-form')?.addEventListener('submit', handleFeedbackSubmit);

  // ── Escape key closes any open modal/dropdown ─────────── //
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCodeModal(); closePackageModal(); closeUcModal(); closeFeedbackModal(); closeAllDropdowns(); }
  });

  // ── Hash-based navigation (browser back/forward) ──────── //
  window.addEventListener('hashchange', () => applyHash());
}

/* ═══════════════════════════════════════════════════════════
   HASH-BASED ROUTING
   ═══════════════════════════════════════════════════════════ */

function applyHash() {
  const raw = window.location.hash.replace('#', '');
  if (!raw) return;
  const [view, slug] = raw.split('+');
  const validViews = ['catalog', 'use-cases', 'releases', 'about'];
  if (!validViews.includes(view)) return;
  switchView(view);
  if (slug && view === 'use-cases') {
    history.replaceState(null, '', '#' + raw); // restore full hash (switchView strips slug)
    scrollToUseCase(slug);
  }
}

function scrollToUseCase(slug) {
  const card = document.querySelector(`.uc-card[data-uc-id="${slug}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('uc-card--highlighted');
  setTimeout(() => card.classList.remove('uc-card--highlighted'), 2000);
  openCodeModal(slug);
}

window.copyUseCaseLink = function(slug) {
  const url = window.location.origin + window.location.pathname + '#use-cases+' + slug;
  const btn = document.querySelector(`.uc-card[data-uc-id="${slug}"] .uc-card__copy-link`);
  navigator.clipboard.writeText(url).then(() => {
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy link', 1500); }
  }).catch(() => {
    if (btn) { btn.textContent = 'Copy failed'; setTimeout(() => btn.textContent = 'Copy link', 1500); }
  });
};

/* ═══════════════════════════════════════════════════════════
   GLOBAL RESET HELPERS
   ═══════════════════════════════════════════════════════════ */

window.resetFilters = function() {
  state.search = ''; state.nature.clear(); state.scope.clear(); state.license.clear(); state.sortBy = 'ranking';
  const si = document.getElementById('search-input'); if (si) si.value = '';
  const ss = document.getElementById('sort-select');  if (ss) ss.value = 'ranking';
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderCatalogAll();
};

window.resetUcFilters = function() {
  state.ucSearch = ''; state.industry.clear(); state.technique.clear(); state.difficulty.clear();
  const si = document.getElementById('uc-search-input'); if (si) si.value = '';
  document.querySelectorAll('.uc-filter-option input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderUcAll();
};

/* ── Copy install command ───────────────────────────────── */
window.copyInstall = function(pkgName, el) {
  navigator.clipboard.writeText(`pip install ${pkgName}`).then(() => {
    const icon = el.querySelector('.fa-copy');
    if (icon) { icon.classList.replace('fa-copy','fa-check'); setTimeout(() => icon.classList.replace('fa-check','fa-copy'), 2000); }
  });
};

/* ── Error state ────────────────────────────────────────── */
function showCatalogError() {
  const grid = document.getElementById('catalog-grid');
  if (grid) grid.innerHTML = `<div class="state-empty"><div class="state-empty__icon">⚠️</div>
    <div class="state-empty__title">Failed to load catalog</div>
    <p class="state-empty__subtitle">Please refresh the page.</p></div>`;
}

/* ── Number formatter ───────────────────────────────────── */
function fmt(n) {
  if (n == null) return '—';
  if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
