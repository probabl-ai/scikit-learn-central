<script setup lang="ts">
import { computed, ref } from 'vue'
import SklearnHero from '@/components/SklearnHero.vue'
import PackageInsightCard from '@/components/PackageInsightCard.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import { usePackages } from '@/composables/usePackages'
import { useUseCases } from '@/composables/useUseCases'
import type { Nature, Scope, License } from '@/types/package'

type SortKey = 'ranking' | 'stars' | 'downloads' | 'name'

const { core, packages } = usePackages()
const { useCasesByPackage } = useUseCases()

const search = ref('')
const natureSel = ref<Set<Nature>>(new Set())
const scopeSel = ref<Set<Scope>>(new Set())
const licenseSel = ref<Set<License>>(new Set())
const sortBy = ref<SortKey>('ranking')

const NATURES = ['library', 'extension', 'application'] as const satisfies readonly Nature[]
const SCOPES = ['core', 'incremental', 'verticalized'] as const satisfies readonly Scope[]
const LICENSES = ['MIT', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0', 'GPL-3.0'] as const

function countBy<K extends keyof (typeof packages.value)[number]>(
  key: K,
  val: unknown,
): number {
  return packages.value.filter((p) => p[key] === val).length
}

const natureOptions = computed(() =>
  NATURES.map((v) => ({ value: v, label: cap(v), count: countBy('nature', v) })),
)
const scopeOptions = computed(() =>
  SCOPES.map((v) => ({ value: v, label: cap(v), count: countBy('scope', v) })),
)
const licenseOptions = computed(() =>
  LICENSES.map((v) => ({ value: v, label: v, count: countBy('license', v) })),
)

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Use cases for the sklearn hero (count only). The per-card cards pull
    the full UseCase[] list from useCasesByPackage so they can render titles. */
const ucForCorePkg = computed(
  () => useCasesByPackage.value.get('scikit-learn')?.length ?? 0,
)

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
  if (natureSel.value.size) r = r.filter((p) => natureSel.value.has(p.nature))
  if (scopeSel.value.size) r = r.filter((p) => scopeSel.value.has(p.scope))
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
    natureSel.value.size > 0 ||
    scopeSel.value.size > 0 ||
    licenseSel.value.size > 0,
)

function resetFilters(): void {
  search.value = ''
  natureSel.value = new Set()
  scopeSel.value = new Set()
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
  addAll('nature', natureSel)
  addAll('scope', scopeSel)
  addAll('license', licenseSel)
  return chips
})

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
        <FilterDropdown v-model="natureSel" label="Nature" :options="natureOptions" />
        <FilterDropdown v-model="scopeSel" label="Scope" :options="scopeOptions" />
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
      <SklearnHero :core="core" :use-case-count="ucForCorePkg" />

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
        <PackageInsightCard
          v-for="pkg in filtered"
          :key="pkg.id"
          :pkg="pkg"
          :use-cases="useCasesByPackage.get(pkg.id) ?? []"
          :show-fit-chip="true"
          :is-probabl-boosted="
            sortBy === 'ranking' && pkg.probabl === true && pkg.scope === 'core'
          "
        />
      </div>
    </div>
  </div>
</template>
