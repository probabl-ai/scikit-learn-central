<script setup lang="ts">
import { computed, ref } from 'vue'
import SklearnHero from '@/components/SklearnHero.vue'
import PackageCard from '@/components/PackageCard.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import { usePackages } from '@/composables/usePackages'
import { useUseCases } from '@/composables/useUseCases'
import type { Category, License } from '@/types/package'
import { CATEGORIES, CATEGORY_META } from '@/types/package'

type SortKey = 'ranking' | 'stars' | 'downloads' | 'name'

const { core, packages } = usePackages()
const { useCases, useCasesByPackage } = useUseCases()

const search = ref('')
const categorySel = ref<Set<Category>>(new Set())
const licenseSel = ref<Set<License>>(new Set())
const sortBy = ref<SortKey>('ranking')

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

function resetFilters(): void {
  search.value = ''
  categorySel.value = new Set()
  licenseSel.value = new Set()
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
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar__inner">
      <div class="filter-bar__search">
        <i class="fas fa-search filter-bar__search-icon"></i>
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Search packages…"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <div class="filter-bar__groups">
        <FilterDropdown v-model="categorySel" label="Category" :options="categoryOptions" />
        <FilterDropdown v-model="licenseSel" label="License" :options="licenseOptions" />
      </div>

      <div class="filter-bar__end">
        <select v-model="sortBy" class="sort-select--inline" title="Sort by">
          <option value="ranking">Sort: Fit Score</option>
          <option value="stars">Sort: Stars</option>
          <option value="downloads">Sort: Monthly Downloads</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
        <button
          class="filter-bar__clear"
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
        <span class="active-filter-tag__remove">✕</span>
      </span>
    </div>
  </div>

  <div id="view-catalog" class="view" role="tabpanel" aria-label="Package catalog">
    <div class="page-content">
      <SklearnHero :core="core" :use-case-count="ucForCore" />

      <div class="catalog-header">
        <h2 class="catalog-header__title">Ecosystem Packages</h2>
        <span class="catalog-header__count" aria-live="polite">
          {{ filtered.length }} package{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="filtered.length === 0" class="state-empty">
        <div class="state-empty__icon">🔭</div>
        <div class="state-empty__title">No packages found</div>
        <p class="state-empty__subtitle">Try different search terms or reset your filters.</p>
        <button class="btn btn--outline" @click="resetFilters">Reset Filters</button>
      </div>

      <div v-else id="catalog-grid" class="catalog-grid">
        <PackageCard
          v-for="pkg in filtered"
          :key="pkg.id"
          :pkg="pkg"
          :use-cases="useCasesByPackage.get(pkg.id) ?? []"
          :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
          :show-fit-chip="true"
          :is-probabl-boosted="
            sortBy === 'ranking' && pkg.probabl === true
          "
        />
      </div>
    </div>
  </div>
</template>
