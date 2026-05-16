<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FilterBottomSheet from '@/components/FilterBottomSheet.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import UseCaseCard from '@/components/UseCaseCard.vue'
import { useUseCaseCatalogGroups, type UseCaseGroupByKey } from '@/composables/useUseCaseCatalogGroups'
import { useUseCasePackagesPanelHeights } from '@/composables/useUseCasePackagesPanelHeights'
import { useUseCasePackagesExpand } from '@/composables/useUseCasePackagesExpand'
import { useUseCases } from '@/composables/useUseCases'
import type { Difficulty, UseCase } from '@/types/usecase'
import {
  APPLICATION_FIELDS,
  DATA_TYPES,
  PROBLEM_TYPES,
  difficultyRank,
  humanizeTaxonomyValue,
} from '@/types/usecase-taxonomy'

const route = useRoute()
const router = useRouter()
const { useCases } = useUseCases()

/** Slug with ?slug= deep link: permanent border + expanded synopsis. */
const focusedSlug = ref<string | null>(null)
/** Brief breathing ring; cleared when uc-focus-pulse animation ends. */
const pulsingSlug = ref<string | null>(null)

const search = ref('')
const applicationFieldSel = ref<Set<string>>(new Set())
const problemTypeSel = ref<Set<string>>(new Set())
const dataTypeSel = ref<Set<string>>(new Set())
const difficultySel = ref<Set<Difficulty>>(new Set())
const groupBy = ref<UseCaseGroupByKey>('none')
const sortByDifficulty = ref(false)

/* Package filter — set by the "Used in N use cases" pill on a PackageCard,
   which links here with ?package=<id>. We mirror the URL into state so
   back/forward + sharing both work. */
const packageFilter = ref<string>(
  typeof route.query.package === 'string' ? route.query.package : '',
)

/** Longest card-enter delay in .uc-grid (see components.css). */
const CARD_ENTER_MS = 320
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function clearPackageFilter(): void {
  packageFilter.value = ''
  /* Drop the query string from the URL so a refresh doesn't bring it back. */
  const { package: _drop, ...rest } = route.query
  router.replace({ path: route.path, query: rest })
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const satisfies
  readonly Difficulty[]

function countUcBy(predicate: (uc: UseCase) => boolean): number {
  return useCases.value.filter(predicate).length
}

function taxonomyOptions(
  allowlist: readonly string[],
  hasValue: (uc: UseCase, slug: string) => boolean,
) {
  return allowlist
    .map((v) => ({
      value: v,
      label: humanizeTaxonomyValue(v),
      count: countUcBy((uc) => hasValue(uc, v)),
    }))
    .filter((o) => o.count > 0)
}

const applicationFieldOptions = computed(() =>
  taxonomyOptions(APPLICATION_FIELDS, (uc, v) => uc.application_fields.includes(v)),
)
const problemTypeOptions = computed(() =>
  taxonomyOptions(PROBLEM_TYPES, (uc, v) => uc.problem_types.includes(v)),
)
const dataTypeOptions = computed(() =>
  taxonomyOptions(DATA_TYPES, (uc, v) => uc.data_types.includes(v)),
)
const difficultyOptions = computed(() =>
  DIFFICULTIES.map((v) => ({
    value: v,
    label: humanizeTaxonomyValue(v),
    count: countUcBy((uc) => uc.difficulty === v),
  })).filter((o) => o.count > 0),
)

const filtered = computed(() => {
  let r = [...useCases.value]
  if (packageFilter.value)
    r = r.filter((uc) => uc.packages.includes(packageFilter.value))
  const q = search.value.trim().toLowerCase()
  if (q) {
    r = r.filter(
      (uc) =>
        uc.title.toLowerCase().includes(q) ||
        uc.synopsis.toLowerCase().includes(q) ||
        uc.application_fields.some((i) => i.includes(q)) ||
        uc.problem_types.some((t) => t.includes(q)) ||
        uc.data_types.some((d) => d.includes(q)) ||
        uc.packages.some((p) => p.includes(q)),
    )
  }
  if (applicationFieldSel.value.size)
    r = r.filter((uc) =>
      uc.application_fields.some((i) => applicationFieldSel.value.has(i)),
    )
  if (problemTypeSel.value.size)
    r = r.filter((uc) => uc.problem_types.some((t) => problemTypeSel.value.has(t)))
  if (dataTypeSel.value.size)
    r = r.filter((uc) => uc.data_types.some((d) => dataTypeSel.value.has(d)))
  if (difficultySel.value.size)
    r = r.filter((uc) => difficultySel.value.has(uc.difficulty))
  return r
})

function sortUseCases(list: UseCase[]): UseCase[] {
  if (!sortByDifficulty.value) return list
  return [...list].sort((a, b) => {
    const d = difficultyRank(a.difficulty) - difficultyRank(b.difficulty)
    return d !== 0 ? d : a.title.localeCompare(b.title)
  })
}

const sortedFiltered = computed(() => sortUseCases(filtered.value))

const { groupedSections } = useUseCaseCatalogGroups(sortedFiltered, groupBy)

const hasAnyFilter = computed(
  () =>
    !!search.value ||
    !!packageFilter.value ||
    applicationFieldSel.value.size > 0 ||
    problemTypeSel.value.size > 0 ||
    dataTypeSel.value.size > 0 ||
    difficultySel.value.size > 0,
)

function resetFilters(): void {
  search.value = ''
  applicationFieldSel.value = new Set()
  problemTypeSel.value = new Set()
  dataTypeSel.value = new Set()
  difficultySel.value = new Set()
  clearPackageFilter()
}

interface ActiveChip {
  key: string
  label: string
  remove: () => void
}

const activeChips = computed<ActiveChip[]>(() => {
  const chips: ActiveChip[] = []
  if (packageFilter.value) {
    chips.push({
      key: `package:${packageFilter.value}`,
      label: `uses ${packageFilter.value}`,
      remove: clearPackageFilter,
    })
  }
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
    labelFor: (v: T) => string = (v) => v,
  ): void => {
    for (const v of set.value) {
      chips.push({
        key: `${prefix}:${v}`,
        label: labelFor(v),
        remove: () => {
          const next = new Set(set.value)
          next.delete(v)
          set.value = next
        },
      })
    }
  }
  addAll('application-field', applicationFieldSel, humanizeTaxonomyValue)
  addAll('problem-type', problemTypeSel, humanizeTaxonomyValue)
  addAll('data-type', dataTypeSel, humanizeTaxonomyValue)
  addAll('difficulty', difficultySel, humanizeTaxonomyValue)
  return chips
})

function slugFromQuery(raw: unknown): string | null {
  if (typeof raw === 'string' && raw) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0]) return raw[0]
  return null
}

function isSlugVisible(slug: string): boolean {
  return filtered.value.some((uc) => uc.slug === slug)
}

function clearPulse(): void {
  pulsingSlug.value = null
}

function clearFocus(): void {
  focusedSlug.value = null
  clearPulse()
}

function startPulse(slug: string): void {
  pulsingSlug.value = null
  void nextTick(() => {
    pulsingSlug.value = slug
  })
}

async function focusUseCaseFromSlug(slug: string): Promise<void> {
  const target = useCases.value.find((uc) => uc.slug === slug)
  if (!target) return

  if (!isSlugVisible(slug)) resetFilters()

  await nextTick()
  // card-enter animation on .uc-grid > .card overrides focus pulse until it ends
  await new Promise<void>((resolve) => setTimeout(resolve, CARD_ENTER_MS))

  const el = document.querySelector<HTMLElement>(`[data-uc-id="${CSS.escape(slug)}"]`)
  if (!el) return

  el.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })

  focusedSlug.value = slug
  startPulse(slug)
}

function focusFromRouteQuery(): void {
  const slug = slugFromQuery(route.query.slug)
  if (!slug) {
    clearFocus()
    return
  }
  void focusUseCaseFromSlug(slug)
}

onMounted(focusFromRouteQuery)
watch(() => route.query.slug, focusFromRouteQuery)
watch(
  () => route.query.package,
  (v) => (packageFilter.value = typeof v === 'string' ? v : ''),
)

const filtersSheetOpen = ref(false)

const viewUseCasesEl = ref<HTMLElement | null>(null)
const { useCasePackagesExpanded } = useUseCasePackagesExpand()
const { syncExpandedPanelHeights } = useUseCasePackagesPanelHeights(viewUseCasesEl)

watch(
  () => filtered.value.length,
  () => void nextTick(syncExpandedPanelHeights),
)

watch(useCasePackagesExpanded, () => {
  void nextTick(syncExpandedPanelHeights)
})

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
          placeholder="Search use cases…"
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
        <FilterDropdown
          v-model="applicationFieldSel"
          label="Application Field"
          :options="applicationFieldOptions"
        />
        <FilterDropdown
          v-model="problemTypeSel"
          label="Problem Type"
          :options="problemTypeOptions"
        />
        <FilterDropdown
          v-model="dataTypeSel"
          label="Data Type"
          :options="dataTypeOptions"
        />
        <FilterDropdown
          v-model="difficultySel"
          label="Difficulty"
          :options="difficultyOptions"
        />
      </div>

      <div class="filter-bar-end filter-bar-end--desktop">
        <button
          type="button"
          class="uc-sort-difficulty"
          :class="{ 'is-active': sortByDifficulty }"
          :aria-pressed="sortByDifficulty"
          title="Sort by difficulty (beginner → advanced)"
          @click="sortByDifficulty = !sortByDifficulty"
        >
          Sort: Difficulty
        </button>
        <select v-model="groupBy" class="sort-select--inline" title="Group by">
          <option value="none">Group: None</option>
          <option value="application-field">Group: Application Field</option>
          <option value="problem-type">Group: Problem Type</option>
          <option value="data-type">Group: Data Type</option>
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

    <FilterBottomSheet v-model="filtersSheetOpen" title="Use case filters">
      <div v-if="filtersSheetOpen" class="filter-sheet-stack">
        <FilterDropdown
          v-model="applicationFieldSel"
          label="Application Field"
          :options="applicationFieldOptions"
        />
        <FilterDropdown
          v-model="problemTypeSel"
          label="Problem Type"
          :options="problemTypeOptions"
        />
        <FilterDropdown
          v-model="dataTypeSel"
          label="Data Type"
          :options="dataTypeOptions"
        />
        <FilterDropdown
          v-model="difficultySel"
          label="Difficulty"
          :options="difficultyOptions"
        />
        <div class="filter-sheet-display">
          <span class="filter-sheet-display-label">Sort</span>
          <button
            type="button"
            class="uc-sort-difficulty uc-sort-difficulty--sheet"
            :class="{ 'is-active': sortByDifficulty }"
            :aria-pressed="sortByDifficulty"
            title="Sort by difficulty (beginner → advanced)"
            @click="sortByDifficulty = !sortByDifficulty"
          >
            Sort: Difficulty
          </button>
          <label class="filter-sheet-display-label" for="uc-group-sheet">Group by</label>
          <select id="uc-group-sheet" v-model="groupBy" class="sort-select--inline" title="Group by">
            <option value="none">None</option>
            <option value="application-field">Application Field</option>
            <option value="problem-type">Problem Type</option>
            <option value="data-type">Data Type</option>
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
    id="view-use-cases"
    ref="viewUseCasesEl"
    class="view use-cases-page"
    role="tabpanel"
    aria-label="Use case explorer"
  >
    <div class="page-content">
      <div class="uc-toolbar">
        <span class="uc-count" aria-live="polite">
          {{ filtered.length }} use case{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="filtered.length === 0" class="state-empty">
        <div class="state-empty-icon">🔬</div>
        <div class="state-empty-title">No use cases found</div>
        <p class="state-empty-subtitle">Try different filters or search terms.</p>
        <button class="btn btn--outline" @click="resetFilters">Reset Filters</button>
      </div>

      <template v-else>
        <div v-if="groupBy === 'none'" class="uc-grid">
          <UseCaseCard
            v-for="uc in sortedFiltered"
            :key="uc.uuid"
            :use-case="uc"
            :focused="focusedSlug === uc.slug"
            :pulsing="pulsingSlug === uc.slug"
            @pulse-end="clearPulse"
          />
        </div>
        <template v-else>
          <section
            v-for="(section, sectionIndex) in groupedSections"
            :key="section.key"
            class="uc-group"
            :class="{ 'uc-group--first': sectionIndex === 0 }"
            :aria-labelledby="`uc-group-${section.key}`"
          >
            <h3 :id="`uc-group-${section.key}`" class="uc-group-title">
              {{ section.label }}
              <span class="uc-group-count">{{ section.useCases.length }}</span>
            </h3>
            <div class="uc-grid">
              <UseCaseCard
                v-for="uc in section.useCases"
                :key="`${section.key}-${uc.uuid}`"
                :use-case="uc"
                :focused="focusedSlug === uc.slug"
                :pulsing="pulsingSlug === uc.slug"
                @pulse-end="clearPulse"
              />
            </div>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.use-cases-page {
  min-width: 0;
}

.uc-sort-difficulty {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid var(--neutral-300);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--neutral-700);
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color var(--duration-sm) var(--ease),
    color var(--duration-sm) var(--ease),
    background var(--duration-sm) var(--ease);
}

.uc-sort-difficulty:hover,
.uc-sort-difficulty:focus-visible {
  border-color: var(--color-near-black);
  outline: none;
}

.uc-sort-difficulty.is-active {
  border-color: var(--color-orange);
  color: var(--color-orange);
  background: var(--orange-050);
}

.uc-sort-difficulty--sheet {
  width: 100%;
  max-width: 100%;
}

.uc-group {
  margin-top: var(--space-8);
}

.uc-group--first {
  margin-top: 0;
}

.uc-group-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

.uc-group-count {
  font-weight: 500;
  color: var(--text-muted);
}
</style>
