<script setup lang="ts">
import { computed, ref } from 'vue'
import SklearnHero from '@/components/SklearnHero.vue'
import PackageCard from '@/components/PackageCard.vue'
import PackageListRow from '@/components/PackageListRow.vue'
import PackageListColumnHeader from '@/components/PackageListColumnHeader.vue'
import CatalogListShell from '@/components/CatalogListShell.vue'
import FilterBottomSheet from '@/components/FilterBottomSheet.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import { useCatalogDescriptionExpand } from '@/composables/useCatalogDescriptionExpand'
import { usePackages } from '@/composables/usePackages'
import { useUseCases } from '@/composables/useUseCases'
import type { Category, License } from '@/types/package'
import { CATEGORIES, CATEGORY_META } from '@/types/package'

type SortKey = 'ranking' | 'stars' | 'downloads' | 'name'
type CatalogLayout = 'cards' | 'list'

const { core, packages, featuredPackages } = usePackages()
const { useCases, useCasesByPackage } = useUseCases()
const { setCatalogDescriptionsExpanded } = useCatalogDescriptionExpand()

const search = ref('')
const categorySel = ref<Set<Category>>(new Set())
const licenseSel = ref<Set<License>>(new Set())
const sortBy = ref<SortKey>('ranking')
const catalogLayout = ref<CatalogLayout>('cards')

const LICENSES = ['MIT', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0', 'GPL-3.0'] as const

function countCategory(c: Category): number {
  return packages.value.filter((p) => p.categories?.includes(c)).length
}

function countLicense(l: string): number {
  return packages.value.filter((p) => p.license === l).length
}

const categoryOptions = computed(() =>
  CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_META[c].label,
    count: countCategory(c),
    group: CATEGORY_META[c].tierLabel, // grouping header in the dropdown
    tier: CATEGORY_META[c].tier,
  })),
)
const licenseOptions = computed(() =>
  LICENSES.map((v) => ({ value: v, label: v, count: countLicense(v) })),
)

const useCaseCountByPkg = computed(() => {
  const map = new Map<string, number>()
  for (const uc of useCases.value) {
    for (const id of uc.packages) map.set(id, (map.get(id) ?? 0) + 1)
  }
  return map
})

const filtered = computed(() => {
  let r = [...packages.value]
  const q = search.value.trim().toLowerCase()
  if (q) {
    r = r.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        (p.pypi_name ?? '').toLowerCase().includes(q),
    )
  }
  if (categorySel.value.size) {
    r = r.filter((p) =>
      (p.categories ?? []).some((c) => categorySel.value.has(c)),
    )
  }
  if (licenseSel.value.size) r = r.filter((p) => licenseSel.value.has(p.license))

  r.sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'stars') return (b.stars ?? 0) - (a.stars ?? 0)
    if (sortBy.value === 'downloads') return (b.downloads ?? 0) - (a.downloads ?? 0)
    return (b.fitTotal ?? 0) - (a.fitTotal ?? 0)
  })
  return r
})

const hasAnyFilter = computed(
  () =>
    !!search.value ||
    categorySel.value.size > 0 ||
    licenseSel.value.size > 0,
)

const featuredForDisplay = computed(() => {
  const featured = featuredPackages.value
  if (!hasAnyFilter.value) return featured
  const allowed = new Set(filtered.value.map((p) => p.id))
  return featured.filter((p) => allowed.has(p.id))
})

function resetFilters(): void {
  search.value = ''
  categorySel.value = new Set()
  licenseSel.value = new Set()
  setCatalogDescriptionsExpanded(false)
}

interface ActiveChip {
  key: string
  label: string
  remove: () => void
}

const activeChips = computed<ActiveChip[]>(() => {
  const chips: ActiveChip[] = []
  if (search.value) {
    chips.push({
      key: 'search',
      label: `"${search.value}"`,
      remove: () => (search.value = ''),
    })
  }
  const addAll = <T extends string>(
    prefix: string,
    set: { value: Set<T> },
  ): void => {
    for (const v of set.value) {
      chips.push({
        key: `${prefix}:${v}`,
        label: v,
        remove: () => {
          const next = new Set(set.value)
          next.delete(v)
          set.value = next
        },
      })
    }
  }
  addAll('category', categorySel)
  addAll('license', licenseSel)
  return chips
})

const ucForCore = computed(() => useCaseCountByPkg.value.get('scikit-learn') ?? 0)

const filtersSheetOpen = ref(false)
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar-inner">
      <div class="filter-bar-search">
        <i class="fas fa-search filter-bar-search-icon"></i>
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Search packages…"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <button
        type="button"
        class="filter-bar-open-filters"
        aria-haspopup="dialog"
        :aria-expanded="filtersSheetOpen"
        @click="filtersSheetOpen = true"
      >
        <i class="fas fa-sliders-h" aria-hidden="true"></i>
        Filters
      </button>

      <div class="filter-bar-groups filter-bar-groups--desktop">
        <FilterDropdown v-model="categorySel" label="Category" :options="categoryOptions" />
        <FilterDropdown v-model="licenseSel" label="License" :options="licenseOptions" />
      </div>

      <div class="filter-bar-end filter-bar-end--desktop">
        <div
          class="catalog-layout-toggle"
          role="group"
          aria-label="Package display layout"
        >
          <button
            type="button"
            class="catalog-layout-toggle__btn"
            :class="{ 'is-active': catalogLayout === 'cards' }"
            :aria-pressed="catalogLayout === 'cards'"
            title="Card layout"
            @click="catalogLayout = 'cards'"
          >
            <i class="fas fa-th" aria-hidden="true"></i>
            <span class="sr-only">Card layout</span>
          </button>
          <button
            type="button"
            class="catalog-layout-toggle__btn"
            :class="{ 'is-active': catalogLayout === 'list' }"
            :aria-pressed="catalogLayout === 'list'"
            title="List layout"
            @click="catalogLayout = 'list'"
          >
            <i class="fas fa-list" aria-hidden="true"></i>
            <span class="sr-only">List layout</span>
          </button>
        </div>
        <select v-model="sortBy" class="sort-select--inline" title="Sort by">
          <option value="ranking">Sort: Fit Score</option>
          <option value="stars">Sort: Stars</option>
          <option value="downloads">Sort: Monthly Downloads</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
        <button
          type="button"
          class="filter-bar-clear"
          :class="{ 'is-visible': hasAnyFilter }"
          @click="resetFilters"
        >
          Clear all
        </button>
      </div>
    </div>

    <div class="chips-bar" :class="{ 'is-visible': activeChips.length > 0 }">
      <span
        v-for="chip in activeChips"
        :key="chip.key"
        class="active-filter-tag"
        @click="chip.remove"
      >
        {{ chip.label }}
        <span class="active-filter-tag-remove">✕</span>
      </span>
    </div>

    <FilterBottomSheet v-model="filtersSheetOpen" title="Package filters">
      <div v-if="filtersSheetOpen" class="filter-sheet-stack">
        <FilterDropdown v-model="categorySel" label="Category" :options="categoryOptions" />
        <FilterDropdown v-model="licenseSel" label="License" :options="licenseOptions" />
        <div class="filter-sheet-display">
          <span class="filter-sheet-display-label">Layout</span>
          <div
            class="catalog-layout-toggle"
            role="group"
            aria-label="Package display layout"
          >
            <button
              type="button"
              class="catalog-layout-toggle__btn"
              :class="{ 'is-active': catalogLayout === 'cards' }"
              :aria-pressed="catalogLayout === 'cards'"
              title="Card layout"
              @click="catalogLayout = 'cards'"
            >
              <i class="fas fa-th" aria-hidden="true"></i>
              <span class="sr-only">Card layout</span>
            </button>
            <button
              type="button"
              class="catalog-layout-toggle__btn"
              :class="{ 'is-active': catalogLayout === 'list' }"
              :aria-pressed="catalogLayout === 'list'"
              title="List layout"
              @click="catalogLayout = 'list'"
            >
              <i class="fas fa-list" aria-hidden="true"></i>
              <span class="sr-only">List layout</span>
            </button>
          </div>
          <label class="filter-sheet-display-label" for="pkg-sort-sheet">Sort</label>
          <select id="pkg-sort-sheet" v-model="sortBy" class="sort-select--inline" title="Sort by">
            <option value="ranking">Fit score</option>
            <option value="stars">Stars</option>
            <option value="downloads">Downloads</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="btn btn--outline btn--sm"
          :disabled="!hasAnyFilter"
          @click="resetFilters"
        >
          Clear all
        </button>
        <button type="button" class="btn btn--primary btn--sm" @click="filtersSheetOpen = false">
          Done
        </button>
      </template>
    </FilterBottomSheet>
  </div>

  <div
    id="view-catalog"
    class="view catalog-page"
    :class="{ 'catalog-page--list': catalogLayout === 'list' }"
    role="tabpanel"
    aria-label="Package catalog"
  >
    <div class="page-content">
      <SklearnHero
        :core="core"
        :use-case-count="ucForCore"
        :use-cases-filter-to="{ path: '/use-cases', query: { package: 'scikit-learn' } }"
      />

      <section
        v-if="featuredForDisplay.length > 0"
        class="catalog-featured"
        aria-labelledby="catalog-featured-heading"
      >
        <div class="catalog-header catalog-header--featured">
          <div class="catalog-header-main">
            <h2 id="catalog-featured-heading" class="catalog-header-title">Featured Packages</h2>
            <p class="catalog-featured-tagline">
              Curated list of packages from our editorial team
            </p>
          </div>
          <span class="catalog-header-count" aria-live="polite">
            {{ featuredForDisplay.length }} package{{
              featuredForDisplay.length !== 1 ? 's' : ''
            }}
          </span>
        </div>
        <div v-if="catalogLayout === 'cards'" class="catalog-grid">
          <PackageCard
            v-for="pkg in featuredForDisplay"
            :key="`featured-${pkg.id}`"
            :pkg="pkg"
            :use-cases="useCasesByPackage.get(pkg.id) ?? []"
            :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
            :show-fit-chip="true"
          />
        </div>
        <CatalogListShell v-else>
          <PackageListColumnHeader />
          <div class="catalog-list">
            <PackageListRow
              v-for="pkg in featuredForDisplay"
              :key="`featured-list-${pkg.id}`"
              :pkg="pkg"
              :use-cases="useCasesByPackage.get(pkg.id) ?? []"
              :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
              :show-fit-chip="true"
            />
          </div>
        </CatalogListShell>
      </section>

      <div class="catalog-header">
        <h2 class="catalog-header-title">Ecosystem Packages</h2>
        <span class="catalog-header-count" aria-live="polite">
          {{ filtered.length }} package{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="filtered.length === 0" class="state-empty">
        <div class="state-empty-icon">🔭</div>
        <div class="state-empty-title">No packages found</div>
        <p class="state-empty-subtitle">Try different search terms or reset your filters.</p>
        <button class="btn btn--outline" @click="resetFilters">Reset Filters</button>
      </div>

      <div v-else-if="catalogLayout === 'cards'" id="catalog-grid" class="catalog-grid">
        <PackageCard
          v-for="pkg in filtered"
          :key="pkg.id"
          :pkg="pkg"
          :use-cases="useCasesByPackage.get(pkg.id) ?? []"
          :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
          :show-fit-chip="true"
        />
      </div>
      <CatalogListShell v-else>
        <PackageListColumnHeader />
        <div id="catalog-list" class="catalog-list">
          <PackageListRow
            v-for="pkg in filtered"
            :key="`list-${pkg.id}`"
            :pkg="pkg"
            :use-cases="useCasesByPackage.get(pkg.id) ?? []"
            :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
            :show-fit-chip="true"
          />
        </div>
      </CatalogListShell>
    </div>
  </div>
</template>

<style scoped>
.catalog-page {
  min-width: 0;
}

.catalog-featured {
  margin-bottom: var(--space-6);
}

.catalog-header--featured {
  align-items: flex-start;
}

.catalog-header-main {
  min-width: 0;
}

.catalog-featured-tagline {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.45;
}

.catalog-layout-toggle {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-surface);
}

.catalog-layout-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  min-height: 36px;
  padding: 0;
  margin: 0;
  border: none;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--duration-sm) var(--ease),
    color var(--duration-sm) var(--ease);
}

.catalog-layout-toggle__btn:last-child {
  border-right: none;
}

.catalog-layout-toggle__btn:hover {
  color: var(--text-primary);
  background: var(--neutral-050);
}

.catalog-layout-toggle__btn.is-active {
  background: var(--neutral-200);
  color: var(--color-near-black);
}

.catalog-layout-toggle__btn:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: -2px;
  z-index: 1;
}
</style>
