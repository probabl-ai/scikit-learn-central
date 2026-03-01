# Use-Cases Refactor Plan: Monolith → Per-File + Index

**Repository:** scikit-learn-central
**Date:** 2026-03-01
**Status:** Awaiting approval

---

## 1. Motivation

`data/use-cases.json` currently ships all 20 use cases — including their full
Python `sample_code` strings — in a single 46 KB file loaded unconditionally
at startup. This creates three problems:

1. **Unnecessary payload at startup.** The ~32 KB of Python code is never
   rendered until a user explicitly opens the code viewer modal, yet it is
   downloaded and parsed on every page load.
2. **No deprecation mechanism.** Retiring a use case means deleting it from
   the array, making git history harder to read and breaking any external
   references.
3. **Hard to extend.** Adding a Jupyter notebook companion or any other
   per-use-case asset requires editing the monolithic file and its loader
   simultaneously.

The packages side of the app already solved all three problems via
`catalog.json` (index) + `data/packages/{id}.json` (individual files). This
refactor mirrors that exact pattern for use cases.

---

## 2. New Folder / File Structure

```
data/
├── catalog.json                          # unchanged
├── stats.json                            # unchanged
├── packages/                             # unchanged
│   ├── skrub.json
│   └── …
├── use-cases.json                        # CHANGED: becomes index file (see §3)
└── use-cases/                            # NEW folder
    ├── {uuid}.json   ← metadata only (no sample_code)
    ├── {uuid}.py     ← sample Python code (companion file)
    └── {uuid}.ipynb  ← optional Jupyter notebook
```

Each use case gets a **UUID v5** filename, generated deterministically from
the legacy `id` string using the URL namespace:

```python
import uuid
NS = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
uid = str(uuid.uuid5(NS, legacy_id))   # e.g. legacy_id = "fraud-detection-banking"
```

This keeps the mapping stable and reproducible — running the migration script
twice always produces the same filenames.

The 20 UUIDs that will be generated:

| Legacy ID | UUID |
|---|---|
| fraud-detection-banking | fc02ec64-ab6b-527e-9143-23b8b85c9379 |
| churn-prediction-telecom | 70c0bf1c-89fc-531e-8fa1-22f321678c43 |
| credit-scoring | 2f0d1820-008b-502b-8b51-0e585f7ee575 |
| predictive-maintenance | 46f5e530-5435-57fa-aba5-5c51b9d4db78 |
| customer-segmentation | df312850-8f5b-5fa7-bb7f-a15cee91d38b |
| demand-forecasting | 640ba620-bbf4-5dad-92f2-e65b436d64e1 |
| anomaly-detection-cybersecurity | 09510792-275d-5641-ad71-4db43cd4eee1 |
| sentiment-analysis | 4640ed73-b8be-5b13-bdcd-1ccfedd6c9ac |
| disease-prediction | c9066ea7-875c-58ec-ae4d-31f7dbee681b |
| employee-attrition | 30000103-b658-585f-a681-276a51ba770b |
| price-optimization | e4946125-4d52-5278-b3ba-2b3873b4e6f9 |
| insurance-claim-severity | d38e9d15-51bd-546e-9146-f71862cd82b0 |
| survival-analysis-healthcare | 6a4976cc-a03a-5460-bbc7-5204af4a541d |
| crop-yield-prediction | 2076f4bf-1944-5c8b-9540-57800e5216a5 |
| energy-consumption-forecasting | 66a3f7c9-da16-590f-b886-0dc5dd5767e3 |
| recommendation-engine | b825fab1-905d-5e6b-98b2-4934b7c21cc4 |
| real-estate-valuation | 5fa7feba-7b07-51c5-a9e7-67fa09e0408c |
| document-routing | 1ae93d9c-259d-5ea5-b803-686e8f62c2dd |
| loan-default-prediction | ad551b7b-e205-5c7a-a269-dbcb506d81c5 |
| online-fraud-detection | 68f82b5d-96b4-5b3f-b79f-42574103337b |

---

## 3. New `data/use-cases.json` — Index File Schema

The monolithic file is replaced by a lightweight index, mirroring the
`"packages"` string array in `catalog.json`:

```json
{
  "meta": {
    "version": "4.0",
    "count": 20,
    "updated": "2026-03-01"
  },
  "use_cases": [
    "fc02ec64-ab6b-527e-9143-23b8b85c9379",
    "70c0bf1c-89fc-531e-8fa1-22f321678c43",
    "..."
  ]
}
```

The ordering in the index controls the default display order on the page,
just as it does for packages.

---

## 4. Individual Use-Case JSON Schema

Each `{uuid}.json` carries all metadata fields **except** `sample_code`,
plus two new fields: `archived` and `has_notebook`.

```json
{
  "uuid": "fc02ec64-ab6b-527e-9143-23b8b85c9379",
  "slug": "fraud-detection-banking",
  "title": "Credit Card Fraud Detection",
  "synopsis": "Detect fraudulent transactions...",
  "industry": ["banking", "insurance"],
  "technique": ["fraud-detection", "anomaly-detection", "classification"],
  "packages": ["scikit-learn", "imbalanced-learn", "xgboost", "shap"],
  "difficulty": "intermediate",
  "archived": false,
  "has_notebook": false
}
```

**New fields:**

| Field | Type | Notes |
|---|---|---|
| `uuid` | string | Self-referential; matches the filename for integrity checks |
| `slug` | string | Preserved legacy `id`; human-readable for logs and future redirect maps |
| `archived` | boolean | Defaults to `false`. Set `true` to retire without deleting |
| `has_notebook` | boolean | Defaults to `false`. When `true`, a `{uuid}.ipynb` file exists |

`sample_code` is **removed** from JSON and lives exclusively in `{uuid}.py`.

---

## 5. Companion `.py` File

Each `{uuid}.py` contains **only** the raw Python source — no JSON wrapper,
no metadata headers — exactly the string previously in `sample_code`.

Fetching a `.py` file uses `response.text()` (not `.json()`). GitHub Pages
serves `.py` files as `text/plain`; no server configuration change is needed.

---

## 6. Changes to `app.js`

### 6a. New `fetchText()` Helper

Add alongside `fetchJSON()`:

```javascript
async function fetchText(url) {
  try {
    const r = await fetch(url);
    return r.ok ? r.text() : null;
  } catch (_) { return null; }
}
```

### 6b. New `loadUseCases()` Function

Add immediately after `loadCatalog()`, following its exact pattern:

```javascript
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
```

### 6c. Updated Bootstrap Block

One-line change in the `Promise.all()` call:

```javascript
const [catalogData, ucData, statsData] = await Promise.all([
  loadCatalog(),
  loadUseCases(),          // was: fetchJSON('data/use-cases.json')
  fetchJSON('data/stats.json'),
]);
```

### 6d. `computeUtilityScores()` — No Change Needed

It only accesses `uc.packages`, which is still present in the new schema.

### 6e. Async `openCodeModal()` — Lazy Code Loading

Replace the current synchronous version with an async one that fetches the
`.py` file on demand, showing the modal immediately with a "Loading…"
placeholder while the fetch is in flight:

```javascript
async function openCodeModal(ucSlug) {
  const uc = useCases?.use_cases.find(u => u.slug === ucSlug);
  if (!uc) return;

  // Populate static fields immediately
  document.getElementById('code-modal-title').textContent = uc.title;
  // … populate synopsis, tags, packages …

  // Show modal right away with a loading indicator in the code block
  const pre = document.getElementById('code-modal-pre');
  if (pre) { pre.textContent = 'Loading…'; pre.removeAttribute('data-highlighted'); }
  document.getElementById('code-modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Lazily fetch the .py file
  const code = await fetchText(`data/use-cases/${uc.uuid}.py`);
  if (pre) {
    pre.textContent = code ?? '# Code not available.';
    if (window.hljs) { pre.removeAttribute('data-highlighted'); window.hljs.highlightElement(pre); }
  }
}
```

### 6f. `renderUcCard()` — Rename `uc.id` → `uc.slug`

Two attribute references change in the card template:

```javascript
// Before
<article class="uc-card" data-uc-id="${uc.id}">
<button … onclick="openCodeModal('${uc.id}')">

// After
<article class="uc-card" data-uc-id="${uc.slug}">
<button … onclick="openCodeModal('${uc.slug}')">
```

### 6g. Optional Notebook Link

When `uc.has_notebook === true`, point a download link at the `.ipynb` file:

```javascript
const notebookEl = document.getElementById('code-modal-notebook-link');
if (notebookEl) {
  notebookEl.href = `data/use-cases/${uc.uuid}.ipynb`;
  notebookEl.style.display = uc.has_notebook ? '' : 'none';
}
```

---

## 7. `populateUcCounts()` and `applyUcFilters()` — No Changes Needed

Both functions only access `uc.industry`, `uc.technique`, `uc.difficulty`,
`uc.title`, `uc.synopsis`, and `uc.packages` — all preserved in the new schema.

---

## 8. Migration Script (`scripts/migrate_use_cases.py`)

A one-time script to perform the data transformation atomically:

```
Step 1: Generate UUID mapping (deterministic uuid5, no file changes)
Step 2: mkdir data/use-cases/, write {uuid}.json + {uuid}.py for each use case
Step 3: Overwrite data/use-cases.json with the new index
Step 4: Integrity check (assert all 20 pairs exist, uuids match, not archived)
```

---

## 9. Implementation Sequence

```
Step 1: Write scripts/migrate_use_cases.py
Step 2: Run migrate script → creates data/use-cases/ + new index
Step 3: Verify integrity output shows "All 20 use cases migrated"
Step 4: Update js/app.js (fetchText, loadUseCases, bootstrap, openCodeModal, renderUcCard)
Step 5: Smoke test locally (python3 -m http.server 8080)
Step 6: Commit + push
```

Steps 2–3 must complete before Step 4 goes live (partial deploy = 404s).

---

## 10. Benefits

| Concern | Before | After |
|---|---|---|
| Startup payload | 46 KB (all code eagerly loaded) | ~2 KB index + ~0.7 KB avg per JSON |
| Code payload | Always downloaded for all 20 use cases | Fetched only when user opens a modal |
| Archiving | Delete from array (destructive) | Set `archived: true` (non-destructive) |
| Adding a use case | Edit monolithic file (merge conflicts) | Add 2 new files + 1 UUID to the index |
| Notebook companion | Not supported | `has_notebook: true` + `{uuid}.ipynb` |
| Startup fetch | Single large blob | 20 small JSONs fetched in parallel |
| Code review diffs | Entire 46 KB file changes | Only the relevant `{uuid}.json` / `.py` |

---

## 11. Browser Caching Compatibility

The index file keeps the same path (`data/use-cases.json`). `loadUseCases()`
detects the format via `typeof ucIndex.use_cases[0] === 'string'`: if a
cached browser delivers the old embedded-object format, the `else` branch
handles it gracefully without crashing. On the next hard-refresh, the new
index is served and the new file structure is used.
