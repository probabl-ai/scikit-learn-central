<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { Category, Package } from '@/types/package'
import { CATEGORY_META } from '@/types/package'
import type { UseCase } from '@/types/usecase'
import { useCatalogDescriptionExpand } from '@/composables/useCatalogDescriptionExpand'
import { fmt, formatReleaseDateLong } from '@/utils/format'

const { catalogDescriptionsExpanded, toggleCatalogDescriptionsExpanded } =
  useCatalogDescriptionExpand()

const props = defineProps<{
  pkg: Package
  useCases?: UseCase[]
  useCaseCount?: number
  showFitChip: boolean
  useCasesFilterTo?: RouteLocationRaw
}>()

interface CategoryGroup {
  category: Category
  tier: 1 | 2 | 3
  tierLabel: string
  subLabels: string[]
}

const scopeCarouselIndex = ref(0)
const cardRoot = ref<HTMLElement | null>(null)
const descRef = ref<HTMLElement | null>(null)
const descExpandable = ref(false)
const tagsViewportEl = ref<HTMLElement | null>(null)
const tagsCarouselCanPrev = ref(false)
const tagsCarouselCanNext = ref(false)
const copied = ref(false)

let tagsResizeObs: ResizeObserver | null = null
let cardResizeObs: ResizeObserver | null = null

const categoryGroups = computed<CategoryGroup[]>(() => {
  const seen = new Set<Category>()
  const rows: Array<CategoryGroup & { sourceIndex: number }> = []
  let sourceIndex = 0
  for (const c of props.pkg.categories ?? []) {
    if (seen.has(c)) continue
    seen.add(c)
    const meta = CATEGORY_META[c]
    rows.push({
      category: c,
      tier: meta.tier,
      tierLabel: meta.tierLabel,
      subLabels: [meta.label],
      sourceIndex: sourceIndex++,
    })
  }
  rows.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.sourceIndex - b.sourceIndex))
  return rows.map(({ category, tier, tierLabel, subLabels }) => ({
    category,
    tier,
    tierLabel,
    subLabels,
  }))
})

const scopeCarouselLen = computed(() => categoryGroups.value.length)

const scopeCarouselTrackStyle = computed(() => ({
  transform: `translateX(-${scopeCarouselIndex.value * 100}%)`,
}))

const descBodyId = computed(() => `pkg-desc-${props.pkg.id}`)

const tagLabels = computed(() => (props.pkg.tags ?? []).map((t) => t.replace(/-/g, ' ')))

const ucTotal = computed(() => props.useCases?.length ?? props.useCaseCount ?? 0)

const useCasesNavigable = computed(
  () => ucTotal.value > 0 && props.useCasesFilterTo !== undefined && props.useCasesFilterTo !== null,
)

const useCasesBrowseTitle = computed(() => {
  const n = ucTotal.value
  if (!n) return ''
  if (useCasesNavigable.value)
    return `Browse the ${n} use case${n !== 1 ? 's' : ''} that use ${props.pkg.name}`
  return `${n} curated use case${n !== 1 ? 's' : ''} for ${props.pkg.name}`
})

const useCasesLinkBind = computed(() =>
  useCasesNavigable.value && props.useCasesFilterTo != null ? { to: props.useCasesFilterTo } : {},
)

const forks = computed(() => props.pkg.stats?.github?.forks)

const releaseVersionDisplay = computed(() => (props.pkg.version ? `v${props.pkg.version}` : '—'))

const releaseDateDisplay = computed(() => {
  const d = formatReleaseDateLong(props.pkg.stats?.pypi?.release_date)
  return d ?? '—'
})

const downloadsWithUnit = computed(() => `${fmt(props.pkg.downloads)}/mo`)

const metaRows = computed(() => [
  {
    key: 'releaseVersion' as const,
    icon: 'fa-tag',
    sr: 'Release version: ',
    value: releaseVersionDisplay.value,
  },
  {
    key: 'releaseDate' as const,
    icon: 'fa-calendar-day',
    sr: 'Release date: ',
    value: releaseDateDisplay.value,
  },
  {
    key: 'license' as const,
    icon: 'fa-scale-balanced',
    sr: 'License: ',
    value: props.pkg.license,
  },
  {
    key: 'forks' as const,
    icon: 'fa-code-branch',
    sr: 'Forks: ',
    value: fmt(forks.value),
  },
  {
    key: 'stars' as const,
    icon: 'fa-star',
    sr: 'Stars: ',
    value: fmt(props.pkg.stars),
  },
  {
    key: 'downloads' as const,
    icon: 'fa-download',
    sr: 'Downloads: ',
    value: downloadsWithUnit.value,
  },
])

const fitDisplay = computed(() => Math.round(props.pkg.fitBase))
const fitStars = computed(() => Math.round(props.pkg.fitStars))
const fitDownloads = computed(() => Math.round(props.pkg.fitDownloads))
const fitUcScore = computed(() => Math.round(props.pkg.fitUseCases))

const fitBreakdownRows = computed(() => [
  { key: 'stars' as const, icon: 'fa-star', label: 'Stars', pct: fitStars.value },
  { key: 'downloads' as const, icon: 'fa-download', label: 'Downloads', pct: fitDownloads.value },
  { key: 'useCases' as const, icon: 'fa-lightbulb', label: 'Use cases', pct: fitUcScore.value },
])

const fitScoreAriaLabel = computed(() => `Fit score ${fitDisplay.value} out of 100`)

/** 0–100 for pill background: more sky at low scores, more orange at high scores. */
const fitScorePillStyle = computed(() => {
  const n = fitDisplay.value
  const p = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
  return { '--fit-pct': `${p}%` }
})

function isTierRedundant(g: CategoryGroup): boolean {
  return g.subLabels.length === 1 && g.subLabels[0] === g.tierLabel
}

function scopeChipTitle(g: CategoryGroup): string {
  if (isTierRedundant(g)) return g.tierLabel
  return `${g.tierLabel}: ${g.subLabels.join(' · ')}`
}

function scopeCarouselPrev(): void {
  const n = scopeCarouselLen.value
  if (n <= 1) return
  scopeCarouselIndex.value = (scopeCarouselIndex.value - 1 + n) % n
}

function scopeCarouselNext(): void {
  const n = scopeCarouselLen.value
  if (n <= 1) return
  scopeCarouselIndex.value = (scopeCarouselIndex.value + 1) % n
}

function measureDescClampable(): void {
  void nextTick(() => {
    requestAnimationFrame(() => {
      const el = descRef.value
      if (!el) return
      if (catalogDescriptionsExpanded.value) return
      descExpandable.value = el.scrollHeight > el.clientHeight + 1
    })
  })
}

function updateTagsCarouselNav(): void {
  const el = tagsViewportEl.value
  if (!el) return
  const { scrollLeft, clientWidth, scrollWidth } = el
  const eps = 3
  tagsCarouselCanPrev.value = scrollLeft > eps
  tagsCarouselCanNext.value = scrollLeft + clientWidth < scrollWidth - eps
}

function tagsCarouselScroll(by: number): void {
  tagsViewportEl.value?.scrollBy({ left: by, behavior: 'smooth' })
}

function tagsCarouselPrev(): void {
  const w = tagsViewportEl.value?.clientWidth ?? 0
  tagsCarouselScroll(-Math.max(w * 0.88, 140))
}

function tagsCarouselNext(): void {
  const w = tagsViewportEl.value?.clientWidth ?? 0
  tagsCarouselScroll(Math.max(w * 0.88, 140))
}

function setupCardResizeObserver(): void {
  cardResizeObs?.disconnect()
  cardResizeObs = null
  void nextTick(() => {
    const el = cardRoot.value
    if (!el) return
    cardResizeObs = new ResizeObserver(() => measureDescClampable())
    cardResizeObs.observe(el)
  })
}

function setupTagsResizeObserver(): void {
  tagsResizeObs?.disconnect()
  tagsResizeObs = null
  void nextTick(() => {
    const el = tagsViewportEl.value
    if (!el) return
    tagsResizeObs = new ResizeObserver(updateTagsCarouselNav)
    tagsResizeObs.observe(el)
    updateTagsCarouselNav()
  })
}

async function copyInstall(): Promise<void> {
  if (!props.pkg.pypi_name) return
  try {
    await navigator.clipboard.writeText(`pip install ${props.pkg.pypi_name}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    /* clipboard unavailable */
  }
}

onMounted(() => {
  void nextTick(() => {
    measureDescClampable()
    setupCardResizeObserver()
  })
  window.addEventListener('resize', measureDescClampable)
})

onUnmounted(() => {
  cardResizeObs?.disconnect()
  cardResizeObs = null
  tagsResizeObs?.disconnect()
  tagsResizeObs = null
  window.removeEventListener('resize', measureDescClampable)
})

watch(() => [props.pkg.id, categoryGroups.value.length] as const, () => {
  scopeCarouselIndex.value = 0
  descExpandable.value = false
  void nextTick(() => {
    measureDescClampable()
    setupCardResizeObserver()
  })
})

watch(() => props.pkg.description, () => {
  descExpandable.value = false
  void nextTick(measureDescClampable)
})

watch(catalogDescriptionsExpanded, () => {
  if (!catalogDescriptionsExpanded.value) void nextTick(measureDescClampable)
})

watch(
  [tagsViewportEl, () => props.pkg.id, () => [...(props.pkg.tags ?? [])]],
  () => setupTagsResizeObserver(),
  { flush: 'post' },
)

</script>

<template>
  <article ref="cardRoot" class="card" :data-id="pkg.id">
    <div
      class="stack"
      :class="{
        'stack--has-scope': categoryGroups.length > 0,
        'stack--has-fit': showFitChip,
      }"
    >
      <div class="headline-row">
        <div class="headline">{{ pkg.name }}</div>
        <div
          v-if="showFitChip"
          class="fit-score-pill"
          :style="fitScorePillStyle"
          :aria-label="fitScoreAriaLabel"
        >
          <span class="fit-score-pill__value">{{ fitDisplay }}</span>
        </div>
      </div>

      <section
        v-if="categoryGroups.length"
        class="panel panel--scope"
        aria-roledescription="carousel"
        :aria-label="`Workflow scope, ${scopeCarouselIndex + 1} of ${scopeCarouselLen}`"
      >
        <div class="scope-carousel">
          <div class="scope-carousel-row">
            <button
              type="button"
              class="scope-carousel-nav scope-carousel-nav--paged"
              :disabled="scopeCarouselLen <= 1"
              aria-label="Previous workflow role"
              @click="scopeCarouselPrev"
            >
              <i class="fas fa-chevron-left" aria-hidden="true"></i>
            </button>
            <div class="scope-carousel-viewport">
              <div class="scope-carousel-track" :style="scopeCarouselTrackStyle">
                <div
                  v-for="(g, slideIdx) in categoryGroups"
                  :key="`${pkg.id}-scope-${g.category}`"
                  class="scope-carousel-slide-cell"
                >
                  <div
                    class="scope-chip scope-chip--carousel"
                    :class="`scope-chip--tier-${g.tier}`"
                    :title="scopeChipTitle(g)"
                  >
                    <template v-if="isTierRedundant(g)">
                      <div class="scope-chip-subs-line scope-chip-subs-line--redundant">
                        <span class="scope-chip-tier">{{ g.tierLabel }}</span>
                        <span class="scope-chip-position" aria-live="polite">{{ slideIdx + 1 }} /
                          {{ scopeCarouselLen }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="scope-chip-tier">{{ g.tierLabel }}</span>
                      <div class="scope-chip-subs-line">
                        <div class="scope-chip-subs">
                          <span class="scope-chip-subline">{{ g.subLabels[0] }}</span>
                        </div>
                        <span class="scope-chip-position" aria-live="polite">{{ slideIdx + 1 }} /
                          {{ scopeCarouselLen }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="scope-carousel-nav scope-carousel-nav--paged"
              :disabled="scopeCarouselLen <= 1"
              aria-label="Next workflow role"
              @click="scopeCarouselNext"
            >
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </section>

      <div class="synopsis" :class="{ 'synopsis--collapsed': !catalogDescriptionsExpanded }">
        <p
          :id="descBodyId"
          ref="descRef"
          class="synopsis-text"
          :class="{ 'synopsis-text--clamped': !catalogDescriptionsExpanded }"
        >
          {{ pkg.description }}
        </p>
        <button
          v-if="catalogDescriptionsExpanded || descExpandable"
          type="button"
          class="synopsis-toggle"
          :aria-expanded="catalogDescriptionsExpanded"
          :aria-controls="descBodyId"
          :aria-label="
            catalogDescriptionsExpanded
              ? 'Show less — collapse descriptions on all packages'
              : 'Show more — expand descriptions on all packages'
          "
          @click="toggleCatalogDescriptionsExpanded"
        >
          {{ catalogDescriptionsExpanded ? 'Show less' : 'Show more' }}
        </button>
      </div>

      <section class="panel panel--meta" aria-label="Package information">
        <div class="meta-panel-head">
          <span class="meta-panel-eyebrow">Information</span>
        </div>
        <ul class="meta">
          <li v-for="row in metaRows" :key="`${pkg.id}-${row.key}`" class="meta-row">
            <i class="fas fa-fw meta-icon" :class="row.icon" aria-hidden="true"></i>
            <span class="sr-only">{{ row.sr }}</span>
            <div class="meta-cell">
              <span class="meta-value">{{ row.value }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section
        v-if="showFitChip"
        class="panel panel--fit"
        aria-label="Fit score breakdown"
      >
        <div class="fit-panel-head">
          <span class="fit-panel-eyebrow">Fit Score</span>
        </div>
        <ul class="fit-breakdown">
          <li v-for="row in fitBreakdownRows" :key="`${pkg.id}-fit-${row.key}`" class="fit-breakdown-row">
            <span class="fit-breakdown-label">
              <i class="fas fa-fw" :class="row.icon" aria-hidden="true"></i>
              {{ row.label }}
            </span>
            <div class="fit-breakdown-track" role="presentation">
              <div class="fit-breakdown-fill" :style="{ width: `${row.pct}%` }"></div>
            </div>
            <span class="fit-breakdown-val">{{ row.pct }}</span>
          </li>
        </ul>
      </section>

      <section class="panel panel--actions" aria-label="Install command and curated use cases">
        <div class="tag-actions-stack">
          <div v-if="pkg.pypi_name" class="install" @click="copyInstall">
            <i class="fas fa-terminal" aria-hidden="true"></i>
            <span>pip install {{ pkg.pypi_name }}</span>
            <i
              class="fas install-copy"
              :class="copied ? 'fa-check' : 'fa-copy'"
              aria-hidden="true"
            ></i>
          </div>
          <div v-else class="install install--empty">
            <i class="fas fa-terminal" aria-hidden="true"></i>
            <span>Not available on PyPI</span>
          </div>

          <component
            :is="useCasesNavigable ? 'router-link' : 'div'"
            v-if="ucTotal"
            v-bind="useCasesLinkBind"
            class="uc-pill"
            :class="{ 'uc-pill--static': !useCasesNavigable }"
            :aria-label="useCasesBrowseTitle"
          >
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            <span>Used in {{ ucTotal }} curated use case{{ ucTotal !== 1 ? 's' : '' }}</span>
            <i
              v-if="useCasesNavigable"
              class="fas fa-arrow-up-right-from-square uc-pill-external"
              aria-hidden="true"
            ></i>
          </component>
          <div
            v-else
            class="uc-pill uc-pill--empty"
            :aria-label="`No curated use cases for ${pkg.name} yet`"
          >
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            <span>No curated use cases yet</span>
          </div>
        </div>
      </section>

      <section class="panel panel--tags" aria-label="Tags">
        <div class="tags-panel-head">
          <span class="tags-panel-eyebrow">TAGS</span>
        </div>
        <div class="tag-box">
          <div v-if="tagLabels.length" class="tags-carousel">
            <div class="tags-carousel-row">
              <button
                type="button"
                class="tags-carousel-nav tags-carousel-nav--paged"
                :disabled="!tagsCarouselCanPrev"
                aria-label="Previous tags"
                @click="tagsCarouselPrev"
              >
                <i class="fas fa-chevron-left" aria-hidden="true"></i>
              </button>
              <div
                ref="tagsViewportEl"
                class="tags-carousel-viewport tag-scroll"
                @scroll.passive="updateTagsCarouselNav"
              >
                <div class="chip-row chip-row--rail">
                  <span v-for="(t, idx) in tagLabels" :key="`${pkg.id}-tag-${idx}`" class="task-chip">{{
                    t
                  }}</span>
                </div>
              </div>
              <button
                type="button"
                class="tags-carousel-nav tags-carousel-nav--paged"
                :disabled="!tagsCarouselCanNext"
                aria-label="Next tags"
                @click="tagsCarouselNext"
              >
                <i class="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div v-else class="tag-empty">No tags recorded</div>
        </div>
      </section>
    </div>

    <div class="footer">
      <div class="outbound">
        <a v-if="pkg.website" :href="pkg.website" target="_blank" class="outbound-link">Homepage</a>
        <a v-if="pkg.repository" :href="pkg.repository" target="_blank" class="outbound-link">
          <i class="fab fa-github"></i> Repo
        </a>
        <a v-if="pkg.docs" :href="pkg.docs" target="_blank" class="outbound-link">
          <i class="fas fa-book"></i> Docs
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
/*
 * Vue <style scoped>: the compiler adds a unique data attribute on this SFC's markup and
 * rewrites selectors so styles do not leak. Child classes are short names nested under .card
 * (see template); shared package chrome lives in components.css under .card … descendants.
 * Grid/flex: allow column width to win over tag strip min-content (overflow + carousels).
 */
.card {
  min-width: 0;
  height: 100%;

  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .stack:not(.stack--has-scope):not(.stack--has-fit) {
    grid-template-rows: auto 1fr auto auto auto;
    grid-template-areas:
      'head'
      'synopsis'
      'meta'
      'actions'
      'tags';
  }

  .stack:not(.stack--has-scope).stack--has-fit {
    grid-template-rows: auto 1fr auto auto auto auto;
    grid-template-areas:
      'head'
      'synopsis'
      'meta'
      'fit'
      'actions'
      'tags';
  }

  .stack.stack--has-scope:not(.stack--has-fit) {
    grid-template-rows: auto auto 1fr auto auto auto;
    grid-template-areas:
      'head'
      'scope'
      'synopsis'
      'meta'
      'actions'
      'tags';
  }

  .stack.stack--has-scope.stack--has-fit {
    grid-template-rows: auto auto 1fr auto auto auto auto;
    grid-template-areas:
      'head'
      'scope'
      'synopsis'
      'meta'
      'fit'
      'actions'
      'tags';
  }

  .headline-row {
    grid-area: head;
  }

  .panel--meta {
    grid-area: meta;
    gap: var(--space-2);
    position: relative;
    overflow: visible;
    isolation: isolate;
    border: 1px solid var(--neutral-200);
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    transition: border-color var(--duration-md) var(--ease);
  }

  .panel--meta::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: var(--radius-sm);
    pointer-events: none;
    z-index: 0;
    background-repeat: no-repeat;
    background-image:
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black)),
      linear-gradient(var(--color-near-black), var(--color-near-black));
    background-size:
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px;
    background-position:
      left 0 top 0,
      left 0 top 0,
      right 0 top 0,
      right 0 top 0,
      left 0 bottom 0,
      left 0 bottom 0,
      right 0 bottom 0,
      right 0 bottom 0;
  }

  .card:hover .panel--meta {
    border-color: var(--color-near-black);
  }

  .meta-panel-head {
    position: relative;
    z-index: 1;
  }

  .meta-panel-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .panel--scope {
    grid-area: scope;
  }

  .panel--actions {
    grid-area: actions;
    min-width: 0;
  }

  .panel--fit {
    grid-area: fit;
    gap: var(--space-2);
    position: relative;
    overflow: visible;
    isolation: isolate;
    border: 1px solid var(--orange-200);
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    transition: border-color var(--duration-md) var(--ease);
  }

  .panel--fit::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: var(--radius-sm);
    pointer-events: none;
    z-index: 0;
    background-repeat: no-repeat;
    background-image:
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange)),
      linear-gradient(var(--color-orange), var(--color-orange));
    background-size:
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px;
    background-position:
      left 0 top 0,
      left 0 top 0,
      right 0 top 0,
      right 0 top 0,
      left 0 bottom 0,
      left 0 bottom 0,
      right 0 bottom 0,
      right 0 bottom 0;
  }

  .card:hover .panel--fit {
    border-color: var(--orange-600);
  }

  .fit-panel-head {
    position: relative;
    z-index: 1;
  }

  .fit-panel-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-orange);
  }

  .fit-breakdown {
    position: relative;
    z-index: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .fit-breakdown-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .fit-breakdown-label {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 6.5rem;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .fit-breakdown-label i {
    color: var(--text-muted);
    font-size: 0.85em;
  }

  .fit-breakdown-track {
    flex: 1;
    min-width: 0;
    height: 6px;
    border-radius: 3px;
    background: var(--neutral-200);
    overflow: hidden;
  }

  .fit-breakdown-fill {
    height: 100%;
    min-width: 0;
    border-radius: 3px;
    background: var(--color-orange);
    transition: width 0.3s var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .fit-breakdown-val {
    flex-shrink: 0;
    min-width: 1.75rem;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--text-primary);
  }

  .panel--tags {
    grid-area: tags;
    gap: var(--space-3);
  }

  .tags-panel-head {
    flex-shrink: 0;
  }

  .tags-panel-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .footer {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: auto;
    min-width: 0;
  }

  .scope-carousel {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .scope-carousel-row {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
    min-height: 0;
  }

  .scope-carousel-nav {
    flex-shrink: 0;
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    min-height: 2.75rem;
    padding: 0;
    margin: 0;
    border: 1px solid var(--neutral-200);
    border-radius: var(--radius-sm);
    background: var(--neutral-050);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      border-color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      background var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));

    &:hover:not(:disabled) {
      border-color: var(--color-near-black);
      color: var(--color-near-black);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--color-sky);
      outline-offset: 2px;
    }

    i {
      font-size: 11px;
    }
  }

  .scope-carousel-viewport {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .scope-carousel-track {
    display: flex;
    flex-flow: row nowrap;
    transition: transform 260ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .scope-carousel-slide-cell {
    box-sizing: border-box;
    flex: 0 0 100%;
    min-width: 0;
    display: flex;
    align-items: stretch;
  }

  .scope-chip.scope-chip--carousel {
    flex: 1;
    width: 100%;
    max-width: none;
    min-width: 0;
    padding-block: var(--space-1);
  }

  .tags-carousel {
    --tags-rail-size: 1.9375rem;
    --tags-rail-gap: var(--space-2);
    width: 100%;
    min-width: 0;
  }

  .tags-carousel-row {
    display: flex;
    align-items: center;
    gap: var(--tags-rail-gap);
    min-width: 0;
  }

  .tags-carousel-viewport {
    flex: 1;
    min-width: 0;
  }

  .tags-carousel-nav {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--tags-rail-size);
    height: var(--tags-rail-size);
    min-height: unset;
    padding: 0;
    margin: 0;
    border: 1px solid var(--neutral-200);
    border-radius: var(--radius-sm);
    background: var(--neutral-050);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      border-color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      background var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));

    &:hover:not(:disabled) {
      border-color: var(--color-near-black);
      color: var(--color-near-black);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--color-sky);
      outline-offset: 2px;
    }

    i {
      font-size: 10px;
      line-height: 1;
    }
  }

  .tags-carousel-viewport.tag-scroll {
    overflow-x: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  @media (max-width: 640px) {
    .scope-carousel-nav--paged,
    .tags-carousel-nav--paged {
      display: none !important;
    }

    .scope-carousel-viewport {
      display: flex;
      flex-flow: row nowrap;
      gap: var(--space-2);
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: var(--border-subtle) transparent;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: 0;
    }

    .scope-carousel-track {
      display: contents;
      transform: none !important;
      transition: none !important;
    }

    .scope-carousel-slide-cell {
      flex: 0 0 auto;
      min-width: 100%;
      scroll-snap-align: start;
    }

    .tags-carousel-viewport.tag-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  }

  .scope-chip-subs-line {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: var(--space-2);
    width: 100%;
    min-width: 0;
  }

  .scope-chip-subs-line--redundant {
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .scope-chip-position {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    white-space: nowrap;
  }

  .scope-chip {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
    box-sizing: border-box;
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--neutral-200);
    background: var(--neutral-050);
    color: var(--text-primary);
    --scope-accent: var(--color-midnight-2);
  }

  .scope-chip--tier-1 {
    --scope-accent: var(--color-sky);
    border-left: 3px solid var(--scope-accent);
  }

  .scope-chip--tier-2 {
    --scope-accent: var(--color-orange);
    border-left: 3px solid var(--scope-accent);
  }

  .scope-chip--tier-3 {
    --scope-accent: var(--color-midnight-2);
    border-left: 3px solid var(--scope-accent);
  }

  .scope-chip-tier {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--scope-accent);
    line-height: 1.25;
  }

  .scope-chip-subs {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
  }

  .scope-chip-subline {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    position: relative;
    z-index: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--space-1);
    row-gap: var(--space-1);
    align-items: start;
  }

  .meta-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.35;
    color: var(--text-secondary);
  }

  .meta-icon {
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 0.875em;
    vertical-align: middle;
    margin-top: 0.125em;
  }

  .meta-cell {
    flex: 1;
    min-width: 0;
  }

  .meta-value {
    display: block;
    min-width: 0;
    font-variant-numeric: tabular-nums;
    overflow: visible;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .synopsis {
    grid-area: synopsis;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
    min-width: 0;
    min-height: 0;
  }

  /* Collapsed: reserve at least three lines so the flex slot still grows with the row */
  .synopsis.synopsis--collapsed {
    min-height: calc(1.65em * 3);
  }

  .synopsis-text {
    margin: 0;
  }

  .synopsis-text--clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    max-height: calc(1.65em * 3);
  }

  .synopsis-toggle {
    align-self: flex-start;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    text-decoration: underline;
    text-underline-offset: 3px;
    color: var(--text-muted);
    transition: color var(--duration-sm) var(--ease-out);
  }

  .synopsis-toggle:hover {
    color: var(--color-near-black);
  }

  .synopsis-toggle:focus-visible {
    outline: 2px solid var(--color-sky);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  .tag-actions-stack {
    position: relative;
    overflow: visible;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    width: 100%;
    align-self: stretch;
    box-sizing: border-box;
    border: 1px solid var(--blue-200);
    border-radius: var(--radius-sm);
    transition: border-color var(--duration-md) var(--ease);
  }

  .tag-actions-stack::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: var(--radius-sm);
    pointer-events: none;
    z-index: 0;
    background-repeat: no-repeat;
    background-image:
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky)),
      linear-gradient(var(--color-sky), var(--color-sky));
    background-size:
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px,
      2px 11px,
      11px 2px;
    background-position:
      left 0 top 0,
      left 0 top 0,
      right 0 top 0,
      right 0 top 0,
      left 0 bottom 0,
      left 0 bottom 0,
      right 0 bottom 0,
      right 0 bottom 0;
  }

  .card:hover .tag-actions-stack {
    border-color: var(--blue-300);
  }

  .tag-actions-stack .install,
  .tag-actions-stack .uc-pill,
  .tag-actions-stack .uc-pill--empty {
    position: relative;
    z-index: 1;
    width: 100%;
    box-sizing: border-box;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 400;
    line-height: 1.35;
  }

  .tag-actions-stack .install {
    margin: 0;
    flex: 0 0 auto;
    border: none;
    border-radius: calc(var(--radius-sm) - 1px) calc(var(--radius-sm) - 1px) 0 0;
    border-bottom: 1px solid var(--blue-100);
    background: transparent;
    color: var(--color-sky);
    padding: 8px 12px;
    transition:
      background var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      border-color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .tag-actions-stack .install > span {
    flex: 1;
    min-width: 0;
    text-align: left;
  }

  .tag-actions-stack .install > i:first-child {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1;
  }

  .tag-actions-stack .install .install-copy {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1;
  }

  .tag-actions-stack .install:hover {
    border-bottom-color: var(--blue-200);
    color: var(--blue-900);
    background: var(--blue-100);
  }

  .tag-actions-stack .install i {
    color: inherit;
    opacity: 1;
  }

  .tag-actions-stack .install.install--empty {
    color: var(--text-muted);
    font-style: italic;
  }

  .tag-actions-stack .install.install--empty:hover {
    background: transparent;
    color: var(--text-muted);
    border-bottom-color: var(--blue-100);
  }

  .tag-actions-stack .install.install--empty i {
    color: var(--text-muted);
  }

  .tag-actions-stack .uc-pill {
    flex: 0 0 auto;
    margin: 0;
    border: none;
    border-radius: 0 0 calc(var(--radius-sm) - 1px) calc(var(--radius-sm) - 1px);
    background: transparent;
    color: var(--text-secondary);
    padding: 8px 12px;
    transition:
      background var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      color var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .tag-actions-stack .uc-pill > span {
    flex: 1;
    min-width: 0;
    text-align: left;
  }

  .tag-actions-stack .uc-pill > i.fa-lightbulb {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1;
    color: inherit;
  }

  .tag-actions-stack .uc-pill.uc-pill--empty {
    background: transparent;
    color: var(--text-secondary);
    font-style: italic;
  }

  .tag-actions-stack .uc-pill.uc-pill--empty:hover {
    background: transparent;
    color: var(--text-secondary);
  }

  .tag-actions-stack .uc-pill.uc-pill--empty i.fa-lightbulb {
    color: inherit;
  }

  .tag-actions-stack .uc-pill-external {
    color: inherit;
    opacity: 0.9;
  }

  .tag-box {
    min-width: 0;
    width: 100%;
  }

  .tag-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
    min-width: 0;
    padding-inline: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;

    &::-webkit-scrollbar {
      height: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-subtle);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .chip-row--rail {
    display: flex;
    flex-flow: row nowrap;
    flex: 0 0 auto;
    align-self: center;
    gap: var(--space-2);
    width: max-content;
    min-width: max-content;
    max-width: none;
    align-items: center;

    .task-chip {
      box-sizing: border-box;
      flex: 0 0 auto;
      height: var(--tags-rail-size, 1.9375rem);
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      line-height: 1;
      white-space: nowrap;
      border: 1px solid var(--neutral-200);
    }
  }

  .tag-empty {
    font-size: var(--brand-typography-size--body-s, 0.875rem);
    color: var(--text-muted);
    font-style: italic;
  }

  .chip-row {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-2);
  }

  .task-chip {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--neutral-100);
    border-radius: var(--radius-sm);
    padding: 4px var(--space-3);
    line-height: 1.3;
  }

  .uc-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--surface-accent-subtle);
    color: var(--color-near-black);
    font-size: var(--brand-typography-size--body-s, 0.875rem);
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .uc-pill.uc-pill--static {
    cursor: default;
  }

  .uc-pill.uc-pill--empty {
    background: var(--neutral-050);
    color: var(--text-muted);
    cursor: default;
    font-style: italic;
  }

  .uc-pill.uc-pill--empty i.fa-lightbulb {
    color: var(--text-muted);
  }

  .uc-pill i.fa-lightbulb {
    color: var(--color-orange);
  }

  .uc-pill-external {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--blue-600);
    opacity: 0.9;
  }

  .uc-pill:hover .uc-pill-external {
    opacity: 1;
  }

  .uc-pill:hover {
    background: var(--surface-accent-subtle-hover);
    color: var(--color-near-black);
  }

  .tag-actions-stack .uc-pill:hover:not(.uc-pill--static):not(.uc-pill--empty) {
    background: var(--blue-100);
    color: var(--text-secondary);
  }

  .tag-actions-stack .uc-pill.uc-pill--static:hover {
    background: transparent;
    color: var(--text-secondary);
  }
}
</style>

