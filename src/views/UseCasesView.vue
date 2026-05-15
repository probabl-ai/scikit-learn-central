<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FilterBottomSheet from '@/components/FilterBottomSheet.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import UseCaseCard from '@/components/UseCaseCard.vue'
import { useUseCases } from '@/composables/useUseCases'
import type { Difficulty, UseCase } from '@/types/usecase'

const route = useRoute()
const router = useRouter()
const { useCases } = useUseCases()

/** Slug with ?slug= deep link: permanent border + expanded synopsis. */
const focusedSlug = ref<string | null>(null)
/** Brief breathing ring; cleared when uc-focus-pulse animation ends. */
const pulsingSlug = ref<string | null>(null)

const search = ref('')
const industrySel = ref<Set<string>>(new Set())
const techniqueSel = ref<Set<string>>(new Set())
const difficultySel = ref<Set<Difficulty>>(new Set())

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

const INDUSTRIES = [
  'banking',
  'insurance',
  'healthcare',
  'retail',
  'e-commerce',
  'manufacturing',
  'telecom',
  'energy',
  'logistics',
  'hr',
  'marketing',
  'real-estate',
  'cybersecurity',
  'agriculture',
] as const

const TECHNIQUES = [
  'fraud-detection',
  'churn-prediction',
  'credit-scoring',
  'predictive-maintenance',
  'recommendation',
  'demand-forecasting',
  'anomaly-detection',
  'customer-segmentation',
  'sentiment-analysis',
  'survival-analysis',
  'time-series',
  'classification',
  'regression',
  'clustering',
  'nlp',
  'explainability',
  'price-optimization',
] as const

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const satisfies
  readonly Difficulty[]

const INDUSTRY_LABELS: Record<string, string> = {
  hr: 'HR / People',
  'e-commerce': 'E-Commerce',
  'real-estate': 'Real Estate',
}

function humanize(s: string): string {
  return INDUSTRY_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

function countUcBy(predicate: (uc: UseCase) => boolean): number {
  return useCases.value.filter(predicate).length
}

const industryOptions = computed(() =>
  INDUSTRIES.map((v) => ({
    value: v,
    label: humanize(v),
    count: countUcBy((uc) => uc.industry.includes(v)),
  })),
)
const techniqueOptions = computed(() =>
  TECHNIQUES.map((v) => ({
    value: v,
    label: humanize(v),
    count: countUcBy((uc) => uc.technique.includes(v)),
  })),
)
const difficultyOptions = computed(() =>
  DIFFICULTIES.map((v) => ({
    value: v,
    label: humanize(v),
    count: countUcBy((uc) => uc.difficulty === v),
  })),
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
        uc.industry.some((i) => i.includes(q)) ||
        uc.technique.some((t) => t.includes(q)) ||
        uc.packages.some((p) => p.includes(q)),
    )
  }
  if (industrySel.value.size)
    r = r.filter((uc) => uc.industry.some((i) => industrySel.value.has(i)))
  if (techniqueSel.value.size)
    r = r.filter((uc) => uc.technique.some((t) => techniqueSel.value.has(t)))
  if (difficultySel.value.size)
    r = r.filter((uc) => difficultySel.value.has(uc.difficulty))
  return r
})

const hasAnyFilter = computed(
  () =>
    !!search.value ||
    !!packageFilter.value ||
    industrySel.value.size > 0 ||
    techniqueSel.value.size > 0 ||
    difficultySel.value.size > 0,
)

function resetFilters(): void {
  search.value = ''
  industrySel.value = new Set()
  techniqueSel.value = new Set()
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
  addAll('industry', industrySel)
  addAll('technique', techniqueSel)
  addAll('difficulty', difficultySel)
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
  // card-enter animation on .uc-grid > .uc-card overrides uc-highlight until it ends
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
          v-model="industrySel"
          label="Industry"
          :options="industryOptions"
        />
        <FilterDropdown
          v-model="techniqueSel"
          label="Technique"
          :options="techniqueOptions"
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
          v-model="industrySel"
          label="Industry"
          :options="industryOptions"
        />
        <FilterDropdown
          v-model="techniqueSel"
          label="Technique"
          :options="techniqueOptions"
        />
        <FilterDropdown
          v-model="difficultySel"
          label="Difficulty"
          :options="difficultyOptions"
        />
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

  <div id="view-use-cases" class="view use-cases-page" role="tabpanel" aria-label="Use case explorer">
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

      <div v-else class="uc-grid">
        <UseCaseCard
          v-for="uc in filtered"
          :key="uc.uuid"
          :use-case="uc"
          :focused="focusedSlug === uc.slug"
          :pulsing="pulsingSlug === uc.slug"
          @pulse-end="clearPulse"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.use-cases-page {
  min-width: 0;
}
</style>
