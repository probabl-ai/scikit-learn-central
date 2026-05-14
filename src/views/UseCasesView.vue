<script setup lang="ts">
import { computed, ref } from 'vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import UseCaseCard from '@/components/UseCaseCard.vue'
import { useUseCases } from '@/composables/useUseCases'
import type { Difficulty, UseCase } from '@/types/usecase'

const { useCases } = useUseCases()

const search = ref('')
const industrySel = ref<Set<string>>(new Set())
const techniqueSel = ref<Set<string>>(new Set())
const difficultySel = ref<Set<Difficulty>>(new Set())

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
    industrySel.value.size > 0 ||
    techniqueSel.value.size > 0 ||
    difficultySel.value.size > 0,
)

function resetFilters(): void {
  search.value = ''
  industrySel.value = new Set()
  techniqueSel.value = new Set()
  difficultySel.value = new Set()
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
  addAll('industry', industrySel)
  addAll('technique', techniqueSel)
  addAll('difficulty', difficultySel)
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
          placeholder="Search use cases…"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <div class="filter-bar__groups">
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

      <div class="filter-bar__end">
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

  <div id="view-use-cases" class="view" role="tabpanel" aria-label="Use case explorer">
    <div class="page-content">
      <div class="uc-toolbar">
        <span class="uc-count" aria-live="polite">
          {{ filtered.length }} use case{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="filtered.length === 0" class="state-empty">
        <div class="state-empty__icon">🔬</div>
        <div class="state-empty__title">No use cases found</div>
        <p class="state-empty__subtitle">Try different filters or search terms.</p>
        <button class="btn btn--outline" @click="resetFilters">Reset Filters</button>
      </div>

      <div v-else class="uc-grid">
        <UseCaseCard v-for="uc in filtered" :key="uc.uuid" :use-case="uc" />
      </div>
    </div>
  </div>
</template>
