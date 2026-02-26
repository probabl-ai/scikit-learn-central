/**
 * app.js — Scikit-learn Central v3
 *
 * Dual-view: "catalog" (package catalog) + "use-cases" (industry use cases).
 * Horizontal filter bars with dropdown panels replace the sidebar.
 * Submit button is context-aware: "Submit Package" vs "Submit Use Case".
 */
'use strict';

/* ── State ──────────────────────────────────────────────── */
let catalog  = null;
let useCases = null;

const state = {
  view: 'catalog',
  // Catalog filters
  search: '', nature: new Set(), scope: new Set(), license: new Set(), maintenance: new Set(), sortBy: 'downloads',
  // Use-case filters
  ucSearch: '', industry: new Set(), technique: new Set(), difficulty: new Set(),
};

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  [catalog, useCases] = await Promise.all([
    loadData('data/catalog.json',    window.CATALOG),
    loadData('data/use-cases.json',  window.USE_CASES),
  ]);

  if (!catalog) { showCatalogError(); return; }

  setTabCount('catalog',    catalog.packages.length + 1);
  if (useCases) setTabCount('use-cases', useCases.use_cases.length);

  populateCatalogCounts();
  if (useCases) populateUcCounts();

  renderCatalogHero();
  renderCatalogAll();
  if (useCases) renderUcAll();

  bindEvents();
});

/* ── Data ───────────────────────────────────────────────── */
async function loadData(url, fallback) {
  try { const r = await fetch(url); if (r.ok) return r.json(); } catch (_) {}
  return fallback || null;
}

/* ═══════════════════════════════════════════════════════════
   VIEW SWITCHING
   ═══════════════════════════════════════════════════════════ */

function switchView(view) {
  state.view = view;
  closeAllDropdowns();

  // Tabs
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('is-active', t.dataset.view === view));

  // Filter bars
  document.getElementById('catalog-filter-bar').style.display = view === 'catalog'    ? '' : 'none';
  document.getElementById('uc-filter-bar').style.display      = view === 'use-cases'  ? '' : 'none';

  // Content views
  document.getElementById('view-catalog').style.display    = view === 'catalog'    ? '' : 'none';
  document.getElementById('view-use-cases').style.display  = view === 'use-cases'  ? '' : 'none';

  // Context-aware submit button
  const label = document.getElementById('btn-submit-label');
  if (label) label.textContent = view === 'catalog' ? 'Submit Package' : 'Submit Use Case';
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

  // Close all first
  closeAllDropdowns();

  // Re-open if it was closed
  if (!wasOpen) {
    panel.classList.add('is-open');
    btn.classList.add('is-open');
  }
}

/**
 * Update a filter button's active badge count.
 * Called after every checkbox change.
 */
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
  updateFilterBtnState('fg-nature',      state.nature);
  updateFilterBtnState('fg-scope',       state.scope);
  updateFilterBtnState('fg-license',     state.license);
  updateFilterBtnState('fg-maintenance', state.maintenance);
  // Show "Clear all" link if any filter is active
  const hasAny = state.search || state.nature.size || state.scope.size || state.license.size || state.maintenance.size;
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
   CATALOG: SIDEBAR COUNTS (now filter-panel counts)
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
  ['active','maintained','deprecated','archived'].forEach(v => set('maintenance', v));
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
          <span class="badge badge--active">${c.maintenance}</span>
          <span class="badge">v${c.version}</span>
        </div>
        <div class="sklearn-hero__compat">
          <span class="sklearn-hero__compat-pill">✓ Provides Estimators</span>
          <span class="sklearn-hero__compat-pill">✓ Consumes Estimators</span>
        </div>
        <div class="sklearn-hero__stats">
          <span class="sklearn-hero__stat"><i class="fas fa-star"></i> ${fmt(c.stars)} stars</span>
          <span class="sklearn-hero__stat"><i class="fas fa-download"></i> ${fmt(c.downloads)}/month</span>
          <span class="sklearn-hero__stat"><i class="fas fa-users"></i> ${fmt(c.contributors_count)}+ contributors</span>
          ${ucCount ? `<span class="sklearn-hero__stat" style="cursor:pointer" onclick="filterUcByPackage('scikit-learn')">
            <i class="fas fa-lightbulb"></i> ${ucCount} use cases</span>` : ''}
        </div>
        <div class="sklearn-hero__links">
          <a href="${c.website}" target="_blank" class="sklearn-hero__link sklearn-hero__link--filled"><i class="fas fa-globe"></i> Website</a>
          <a href="${c.repository}" target="_blank" class="sklearn-hero__link"><i class="fab fa-github"></i> Repo</a>
          <a href="${c.docs}" target="_blank" class="sklearn-hero__link"><i class="fas fa-book"></i> Docs</a>
          <span class="sklearn-hero__link" style="cursor:default;opacity:.7;"><i class="fas fa-terminal"></i> pip install ${c.pypi_name}</span>
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
  let r = [...catalog.packages];
  if (state.search) {
    const q = state.search.toLowerCase();
    r = r.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) || (p.pypi_name||'').toLowerCase().includes(q));
  }
  if (state.nature.size)      r = r.filter(p => state.nature.has(p.nature));
  if (state.scope.size)       r = r.filter(p => state.scope.has(p.scope));
  if (state.license.size)     r = r.filter(p => state.license.has(p.license));
  if (state.maintenance.size) r = r.filter(p => state.maintenance.has(p.maintenance));
  r.sort((a, b) => {
    if (state.sortBy === 'name')      return a.name.localeCompare(b.name);
    if (state.sortBy === 'stars')     return b.stars - a.stars;
    if (state.sortBy === 'downloads') return b.downloads - a.downloads;
    return b.ranking - a.ranking;
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
  add(state.nature, 'nature'); add(state.scope, 'scope'); add(state.license, 'license'); add(state.maintenance, 'maintenance');
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

  return `
    <article class="card" data-id="${pkg.id}">
      <div class="card__name">${pkg.name}</div>
      <div class="badges">
        <span class="badge ${natur[pkg.nature]||''}">${pkg.nature}</span>
        <span class="badge ${scope[pkg.scope]||''}">${pkg.scope}</span>
        <span class="badge badge--license">${pkg.license}</span>
        <span class="badge badge--${pkg.maintenance}">${pkg.maintenance}</span>
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
  if (state.industry.size)  r = r.filter(uc => uc.industry.some(i => state.industry.has(i)));
  if (state.technique.size) r = r.filter(uc => uc.technique.some(t => state.technique.has(t)));
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

  return `
    <article class="uc-card" data-uc-id="${uc.id}">
      <div class="uc-card__difficulty"><span class="difficulty-badge difficulty-badge--${uc.difficulty}">${uc.difficulty}</span></div>
      <div class="uc-card__title">${uc.title}</div>
      <p class="uc-card__synopsis">${uc.synopsis}</p>
      <div class="uc-card__tags">${industryTags}${techTags}</div>
      <div class="uc-card__packages">${pkgChips}</div>
      <div class="uc-card__footer">
        <div></div>
        <button class="btn--view-code" onclick="openCodeModal('${uc.id}')"><i class="fas fa-code"></i> View Code</button>
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

function openCodeModal(ucId) {
  const uc = useCases?.use_cases.find(u => u.id === ucId);
  if (!uc) return;
  document.getElementById('code-modal-title').textContent = uc.title;
  document.getElementById('code-modal-synopsis').textContent = uc.synopsis;

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

  const pre = document.getElementById('code-modal-pre');
  if (pre) {
    pre.textContent = uc.sample_code;
    if (window.hljs) { pre.removeAttribute('data-highlighted'); window.hljs.highlightElement(pre); }
  }

  document.getElementById('code-modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';
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

function handleSubmit(e) {
  e.preventDefault();
  const name = e.target.querySelector('[name="name"]')?.value?.trim();
  if (!name) return;
  e.target.innerHTML = `<div style="text-align:center;padding:var(--space-8)">
    <div style="font-size:2rem;margin-bottom:var(--space-4)">🎉</div>
    <div style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--probabl-blue)">Thank you!</div>
    <p style="color:var(--neutral-600);margin-top:var(--space-3)">We received your submission for <strong>${name}</strong>.</p>
    <button class="btn btn--primary" style="margin-top:var(--space-6)" onclick="closePackageModal()">Close</button>
  </div>`;
}

function handleUcSubmit(e) {
  e.preventDefault();
  const title = e.target.querySelector('[name="title"]')?.value?.trim();
  if (!title) return;
  e.target.innerHTML = `<div style="text-align:center;padding:var(--space-8)">
    <div style="font-size:2rem;margin-bottom:var(--space-4)">🎉</div>
    <div style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--probabl-blue)">Thank you!</div>
    <p style="color:var(--neutral-600);margin-top:var(--space-3)">We received your use case: <strong>${title}</strong>.</p>
    <button class="btn btn--primary" style="margin-top:var(--space-6)" onclick="closeUcModal()">Close</button>
  </div>`;
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
  state.nature.clear(); state.scope.clear(); state.license.clear(); state.maintenance.clear();
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
    if (state.view === 'catalog') openPackageModal();
    else openUcModal();
  });

  // ── Package modal ─────────────────────────────────────── //
  document.querySelectorAll('#modal-backdrop .modal__close').forEach(btn => btn.addEventListener('click', closePackageModal));
  document.getElementById('modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closePackageModal(); });
  document.getElementById('submission-form')?.addEventListener('submit', handleSubmit);

  // ── Use-case modal ────────────────────────────────────── //
  document.querySelectorAll('#uc-modal-backdrop .modal__close').forEach(btn => btn.addEventListener('click', closeUcModal));
  document.getElementById('uc-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'uc-modal-backdrop') closeUcModal(); });
  document.getElementById('uc-submission-form')?.addEventListener('submit', handleUcSubmit);

  // ── Code modal ────────────────────────────────────────── //
  document.getElementById('code-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'code-modal-backdrop') closeCodeModal(); });
  document.querySelectorAll('.code-modal__close').forEach(btn => btn.addEventListener('click', closeCodeModal));

  // ── Escape key closes any open modal/dropdown ─────────── //
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCodeModal(); closePackageModal(); closeUcModal(); closeAllDropdowns(); }
  });
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL RESET HELPERS
   ═══════════════════════════════════════════════════════════ */

window.resetFilters = function() {
  state.search = ''; state.nature.clear(); state.scope.clear(); state.license.clear(); state.maintenance.clear(); state.sortBy = 'downloads';
  const si = document.getElementById('search-input'); if (si) si.value = '';
  const ss = document.getElementById('sort-select');  if (ss) ss.value = 'downloads';
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
    <p class="state-empty__subtitle">Please refresh or serve via a local HTTP server.</p></div>`;
}

/* ── Number formatter ───────────────────────────────────── */
function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K';
  return String(n);
}
