<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import type { Package } from '@/types/package'
import { CATEGORY_META } from '@/types/package'
import type { UseCase } from '@/types/usecase'
import { fmt, formatReleaseDateCompact } from '@/utils/format'

const props = defineProps<{
  pkg: Package
  useCases?: UseCase[]
  useCaseCount?: number
  showFitChip: boolean
  isProbablBoosted: boolean
  useCasesFilterTo?: RouteLocationRaw
}>()

interface CategoryGroup {
  tier: 1 | 2 | 3
  tierLabel: string
  subLabels: string[]
}

type MetaOverflowKey =
  | 'license'
  | 'releaseVersion'
  | 'releaseDate'
  | 'stars'
  | 'forks'
  | 'downloads'

const USECASE_PREVIEW_LIMIT = 5

const scopeCarouselIndex = ref(0)
const descRef = ref<HTMLElement | null>(null)
const isClamped = ref(false)
const tagsViewportEl = ref<HTMLElement | null>(null)
const tagsCarouselCanPrev = ref(false)
const tagsCarouselCanNext = ref(false)
const metaRowsEl = ref<HTMLElement | null>(null)
const copied = ref(false)

const metaOverflow = reactive({
  license: false,
  releaseVersion: false,
  releaseDate: false,
  stars: false,
  forks: false,
  downloads: false,
})

const metaValueEls: Record<MetaOverflowKey, HTMLElement | null> = {
  license: null,
  releaseVersion: null,
  releaseDate: null,
  stars: null,
  forks: null,
  downloads: null,
}

let tagsResizeObs: ResizeObserver | null = null
let metaResizeObs: ResizeObserver | null = null

const categoryGroups = computed<CategoryGroup[]>(() => {
  const byTier = new Map<number, CategoryGroup>()
  for (const c of props.pkg.categories ?? []) {
    const meta = CATEGORY_META[c]
    let g = byTier.get(meta.tier)
    if (!g) {
      g = { tier: meta.tier, tierLabel: meta.tierLabel, subLabels: [] }
      byTier.set(meta.tier, g)
    }
    g.subLabels.push(meta.label)
  }
  return Array.from(byTier.values()).sort((a, b) => a.tier - b.tier)
})

const scopeCarouselLen = computed(() => categoryGroups.value.length)

const scopeCarouselTrackStyle = computed(() => ({
  transform: `translateX(-${scopeCarouselIndex.value * 100}%)`,
}))

const descTooltipId = computed(() => `pkg-desc-${props.pkg.id}`)

const previewUseCases = computed(() => props.useCases?.slice(0, USECASE_PREVIEW_LIMIT) ?? [])

const previewRemainder = computed(() => {
  const total = props.useCases?.length ?? props.useCaseCount ?? 0
  return Math.max(0, total - previewUseCases.value.length)
})

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

const releaseVersionTooltip = computed(() =>
  props.pkg.version ? `Version ${props.pkg.version}` : '—',
)

const releaseDateDisplay = computed(() => {
  const d = formatReleaseDateCompact(props.pkg.stats?.pypi?.release_date)
  return d ?? '—'
})

const releaseDateTooltip = computed(() => releaseDateDisplay.value)

const downloadsWithUnit = computed(() => `${fmt(props.pkg.downloads)}/mo`)

const metaRows = computed(() => [
  {
    key: 'license' as const,
    icon: 'fa-scale-balanced',
    sr: 'License: ',
    value: props.pkg.license,
    tipFull: props.pkg.license,
  },
  {
    key: 'releaseVersion' as const,
    icon: 'fa-tag',
    sr: 'Release version: ',
    value: releaseVersionDisplay.value,
    tipFull: releaseVersionTooltip.value,
  },
  {
    key: 'releaseDate' as const,
    icon: 'fa-calendar-day',
    sr: 'Release date: ',
    value: releaseDateDisplay.value,
    tipFull: releaseDateTooltip.value,
  },
  {
    key: 'stars' as const,
    icon: 'fa-star',
    sr: 'Stars: ',
    value: fmt(props.pkg.stars),
    tipFull: fmt(props.pkg.stars),
  },
  {
    key: 'forks' as const,
    icon: 'fa-code-branch',
    sr: 'Forks: ',
    value: fmt(forks.value),
    tipFull: fmt(forks.value),
  },
  {
    key: 'downloads' as const,
    icon: 'fa-download',
    sr: 'Downloads: ',
    value: downloadsWithUnit.value,
    tipFull: downloadsWithUnit.value,
  },
])

const fitDisplay = computed(() => Math.round(props.pkg.fitBase))
const fitStars = computed(() => Math.round(props.pkg.fitStars))
const fitDownloads = computed(() => Math.round(props.pkg.fitDownloads))
const fitUcScore = computed(() => Math.round(props.pkg.fitUseCases))

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

function measureClamp(): void {
  const el = descRef.value
  if (!el) return
  isClamped.value = el.scrollHeight > el.clientHeight + 1
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

function measureMetaOverflows(): void {
  const keys = Object.keys(metaValueEls) as MetaOverflowKey[]
  for (const k of keys) {
    const el = metaValueEls[k]
    metaOverflow[k] = !!(el && el.scrollWidth > el.clientWidth + 1)
  }
}

function bindMetaValueEl(key: MetaOverflowKey, el: unknown): void {
  metaValueEls[key] = el instanceof HTMLElement ? el : null
  requestAnimationFrame(measureMetaOverflows)
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
  void nextTick(measureClamp)
  metaResizeObs = new ResizeObserver(() => {
    measureMetaOverflows()
  })
  void nextTick(() => {
    if (metaRowsEl.value) metaResizeObs?.observe(metaRowsEl.value)
    measureMetaOverflows()
  })
  window.addEventListener('resize', measureMetaOverflows)
})

onUnmounted(() => {
  metaResizeObs?.disconnect()
  metaResizeObs = null
  tagsResizeObs?.disconnect()
  tagsResizeObs = null
  window.removeEventListener('resize', measureMetaOverflows)
})

watch(() => [props.pkg.id, categoryGroups.value.length] as const, () => {
  scopeCarouselIndex.value = 0
})

watch(() => props.pkg.description, () => {
  void nextTick(measureClamp)
})

watch(
  [tagsViewportEl, () => props.pkg.id, () => [...(props.pkg.tags ?? [])]],
  () => setupTagsResizeObserver(),
  { flush: 'post' },
)

watch(
  () => [
    props.pkg.id,
    props.pkg.license,
    props.pkg.version,
    props.pkg.stats?.pypi?.release_date,
    props.pkg.stars,
    forks.value,
    props.pkg.downloads,
  ],
  () => void nextTick(() => requestAnimationFrame(measureMetaOverflows)),
)
</script>

<template>
  <article class="card" :data-id="pkg.id">
    <div class="stack">
      <div class="headline-row">
        <div class="headline">{{ pkg.name }}</div>
        <div
          v-if="showFitChip"
          class="fit-chip"
          :class="{ 'fit-chip--featured': isProbablBoosted }"
        >
          <template v-if="isProbablBoosted">
            <svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Featured by Probabl">
              <circle cx="200" cy="200" r="200" fill="#1E22AA" />
              <path d="M110.452 145.278H141.492C144.142 145.278 145.278 144.142 145.278 141.493V110.452C145.278 107.803 144.142 106.667 141.492 106.667H110.452C107.802 106.667 106.667 107.803 106.667 110.452V141.493C106.667 144.142 107.802 145.278 110.452 145.278Z" fill="#F68D2E" />
              <path d="M110.452 292.001H141.492C144.142 292.001 145.278 290.865 145.278 288.215V257.175C145.278 254.525 144.142 253.39 141.492 253.39H110.452C107.802 253.39 106.667 254.525 106.667 257.175V288.215C106.667 290.865 107.802 292.001 110.452 292.001Z" fill="#F68D2E" />
              <path d="M257.174 292.001H288.214C290.864 292.001 292 290.865 292 288.215V257.175C292 254.525 290.864 253.39 288.214 253.39H257.174C254.524 253.39 253.389 254.525 253.389 257.175V288.215C253.389 290.865 254.524 292.001 257.174 292.001Z" fill="#F68D2E" />
            </svg>
          </template>
          <template v-else>{{ fitDisplay }}</template>

          <div class="ranking-tooltip" :class="{ 'ranking-tooltip--probabl': isProbablBoosted }">
            <template v-if="isProbablBoosted">
              <div class="ranking-tooltip-title">Featured by :probabl.</div>
              <p class="ranking-tooltip-probabl-body">
                Editorially pinned at the top of the Fit Score ranking. The score shown does not include the ranking boost.
              </p>
              <div class="ranking-tooltip-divider"></div>
            </template>
            <div class="ranking-tooltip-title">Fit Score</div>
            <div class="ranking-tooltip-row">
              <span class="ranking-tooltip-label"><i class="fas fa-star"></i> Stars</span>
              <div class="ranking-tooltip-track"><div class="ranking-tooltip-fill" :style="{ width: fitStars + '%' }"></div></div>
              <span class="ranking-tooltip-val">{{ fitStars }}</span>
            </div>
            <div class="ranking-tooltip-row">
              <span class="ranking-tooltip-label"><i class="fas fa-download"></i> Downloads</span>
              <div class="ranking-tooltip-track"><div class="ranking-tooltip-fill" :style="{ width: fitDownloads + '%' }"></div></div>
              <span class="ranking-tooltip-val">{{ fitDownloads }}</span>
            </div>
            <div class="ranking-tooltip-row">
              <span class="ranking-tooltip-label"><i class="fas fa-lightbulb"></i> Use Cases</span>
              <div class="ranking-tooltip-track"><div class="ranking-tooltip-fill" :style="{ width: fitUcScore + '%' }"></div></div>
              <span class="ranking-tooltip-val">{{ fitUcScore }}</span>
            </div>
          </div>
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
                  :key="`${pkg.id}-scope-${g.tier}-${slideIdx}`"
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
                          <span
                            v-for="(lab, sidx) in g.subLabels"
                            :key="`${g.tier}-${slideIdx}-${sidx}-${lab}`"
                            class="scope-chip-subline"
                          >{{ lab }}</span>
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

      <div
        class="synopsis"
        :class="{ 'synopsis--clamped': isClamped }"
        :tabindex="isClamped ? 0 : undefined"
        :aria-describedby="isClamped ? descTooltipId : undefined"
      >
        <p ref="descRef" class="synopsis-text">
          {{ pkg.description }}
        </p>
        <div
          v-if="isClamped"
          :id="descTooltipId"
          class="synopsis-popover"
          role="tooltip"
        >
          <div class="synopsis-popover-label">About this package</div>
          <p class="synopsis-popover-body">{{ pkg.description }}</p>
        </div>
      </div>

      <section class="panel panel--meta">
        <ul ref="metaRowsEl" class="meta">
          <li v-for="row in metaRows" :key="`${pkg.id}-${row.key}`" class="meta-row">
            <i class="fas fa-fw meta-icon" :class="row.icon" aria-hidden="true"></i>
            <span class="sr-only">{{ row.sr }}</span>
            <div
              class="meta-cell"
              :class="{ 'meta-cell--tip': metaOverflow[row.key] }"
              :tabindex="metaOverflow[row.key] ? 0 : undefined"
            >
              <span
                class="meta-value"
                :class="{
                  'meta-value--single':
                    row.key === 'releaseDate' || row.key === 'license',
                }"
                :ref="(el) => bindMetaValueEl(row.key, el)"
              >{{ row.value }}</span>
              <div
                v-if="metaOverflow[row.key]"
                class="meta-tip"
                role="tooltip"
              >
                {{ row.tipFull }}
              </div>
            </div>
          </li>
        </ul>
      </section>

      <section
        class="panel panel--tags"
        aria-label="Tags and curated use cases"
      >
        <component
          :is="useCasesNavigable ? 'router-link' : 'div'"
          v-if="ucTotal"
          v-bind="useCasesLinkBind"
          class="uc-pill"
          :class="{ 'uc-pill--static': !useCasesNavigable }"
          :title="useCasesBrowseTitle"
        >
          <i class="fas fa-lightbulb"></i>
          <span>Used in {{ ucTotal }} curated use case{{ ucTotal !== 1 ? 's' : '' }}</span>
          <i class="fas fa-arrow-right uc-pill-arrow"></i>

          <div v-if="previewUseCases.length" class="usecases-popover">
            <div class="usecases-popover-title">Preview</div>
            <ul class="usecases-popover-list">
              <li v-for="uc in previewUseCases" :key="uc.uuid" class="usecases-popover-item">
                <span class="usecases-popover-title-text">{{ uc.title }}</span>
                <DifficultyBadge :difficulty="uc.difficulty" />
              </li>
            </ul>
            <div v-if="previewRemainder" class="usecases-popover-more">
              + {{ previewRemainder }} more
            </div>
            <div v-if="useCasesNavigable" class="usecases-popover-cta">
              Click to filter the use-case list →
            </div>
          </div>
        </component>
        <div
          v-else
          class="uc-pill uc-pill--empty"
          :title="`No curated use cases for ${pkg.name} yet`"
        >
          <i class="fas fa-lightbulb"></i>
          <span>No curated use cases yet</span>
        </div>

        <div class="tag-box" aria-label="Tags">
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
      <div v-if="pkg.pypi_name" class="install" @click="copyInstall">
        <i class="fas fa-terminal"></i>
        <span>pip install {{ pkg.pypi_name }}</span>
        <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i>
      </div>
      <div v-else class="install install--empty">
        <i class="fas fa-terminal"></i>
        <span>Not available on PyPI</span>
      </div>

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

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    flex: 1 1 auto;
    min-width: 0;
  }

  .footer {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: auto;
    min-width: 0;

    .outbound {
      margin-top: 0;
      padding-top: 0;
    }
  }

  .ranking-tooltip {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .ranking-tooltip--probabl {
    padding-top: 0;
  }

  .ranking-tooltip-title {
    margin-bottom: 0;
  }

  .ranking-tooltip-row {
    margin-bottom: 0;
  }

  .ranking-tooltip-divider {
    margin: 0;
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
    font-family: var(--brand-typography--texte, var(--font-sans));
    font-size: var(--brand-typography-size--body-s, 0.875rem);
    color: var(--text-secondary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .panel--meta {
    gap: 0;
  }

  .meta {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

    &:has(.meta-cell--tip:hover),
    &:has(.meta-cell--tip:focus-within) {
      position: relative;
      z-index: 25;
    }
  }

  .meta-icon {
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 0.875em;
    vertical-align: middle;
    margin-top: 0.125em;
  }

  .meta-cell {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .meta-cell--tip {
    cursor: help;

    &:focus-visible {
      outline: 2px solid var(--color-sky);
      outline-offset: 2px;
      border-radius: 2px;
    }

    &:hover .meta-tip,
    &:focus-within .meta-tip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
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

  .meta-value--single {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-tip {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    min-width: max(100%, 9rem);
    max-width: min(20rem, calc(100vw - 24px));
    padding: var(--space-2) var(--space-3);
    background: var(--color-near-black);
    color: var(--overlay-on-dark-strong);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.45;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-tooltip-elevated);
    border: 1px solid var(--overlay-on-dark-border);
    z-index: 60;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-4px) scale(0.98);
    transition:
      opacity 120ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      visibility 120ms,
      transform 120ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    word-break: break-word;
  }

  .synopsis {
    min-width: 0;
  }

  .synopsis--clamped {
    position: relative;
    z-index: 1;
    cursor: help;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 2px);
      height: 40px;
      z-index: 48;
      pointer-events: none;
    }

    &:hover::after,
    &:focus-within::after {
      pointer-events: auto;
    }

    &:hover,
    &:focus-within {
      z-index: 20;
    }

    &:focus-visible {
      outline: 2px solid var(--color-sky);
      outline-offset: 2px;
      border-radius: var(--radius-sm, 6px);
    }

    &:hover .synopsis-popover,
    &:focus-within .synopsis-popover {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
  }

  .synopsis-text {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(1.65em * 5);
  }

  .synopsis-popover {
    position: absolute;
    left: calc(-1 * var(--space-2, 0.5rem));
    width: calc(100% + 2 * var(--space-2, 0.5rem));
    top: calc(100% + 6px);
    max-width: min(22rem, calc(100vw - 24px));
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    background: var(--color-near-black);
    color: var(--overlay-on-dark-strong);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-tooltip-layered);
    border: 1px solid var(--overlay-on-dark-border);
    z-index: 50;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px) scale(0.99);
    transform-origin: top center;
    transition:
      opacity 140ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      visibility 140ms,
      transform 140ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    pointer-events: none;
  }

  .synopsis-popover-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-orange);
    margin: 0;
  }

  .synopsis-popover-body {
    margin: 0;
    font-family: var(--brand-typography--texte, var(--font-sans));
    font-size: var(--brand-typography-size--body-sm, 0.8125rem);
    font-weight: 400;
    line-height: 1.55;
    color: var(--overlay-on-dark-soft);
    max-height: min(14rem, 45vh);
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  .panel--tags {
    gap: var(--space-3);

    > .uc-pill,
    > .uc-pill--empty {
      align-self: stretch;
      width: 100%;
      box-sizing: border-box;
    }
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

    &--static {
      cursor: default;
    }

    &--empty {
      background: var(--neutral-050);
      color: var(--text-muted);
      cursor: default;
      font-style: italic;

      i.fa-lightbulb {
        color: var(--text-muted);
      }
    }

    i.fa-lightbulb {
      color: var(--color-orange);
    }

    &-arrow {
      margin-left: auto;
      opacity: 0.55;
      font-size: 11px;
      transition: transform var(--duration-sm, 120ms) var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    }

    &:hover {
      background: var(--surface-accent-subtle-hover);
      color: var(--color-near-black);

      .uc-pill-arrow {
        transform: translateX(2px);
        opacity: 1;
      }
    }

    &:hover .usecases-popover,
    &:focus-visible .usecases-popover {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }
  }

  .usecases-popover {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    background: var(--color-midnight);
    color: var(--text-on-blue);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    z-index: 50;
    box-shadow: var(--shadow-tooltip-elevated);
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px) scale(0.97);
    transform-origin: bottom left;
    transition:
      opacity 125ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)),
      visibility 125ms,
      transform 125ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .usecases-popover-title {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-orange);
    margin: 0;
  }

  .usecases-popover-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .usecases-popover-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 0;
    margin: 0;
  }

  .usecases-popover-title-text {
    font-size: 12px;
    color: var(--text-on-blue);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .usecases-popover-more {
    font-size: 11px;
    color: var(--overlay-on-dark-muted);
    margin: 0;
  }

  .usecases-popover-cta {
    font-size: 11px;
    color: var(--color-orange);
    margin: 0;
    padding-top: var(--space-2);
    border-top: 1px solid var(--overlay-on-dark-hairline);
  }

  .install.install--empty {
    cursor: default;
    color: var(--text-muted);
    font-style: italic;

    &:hover {
      border-color: var(--border-subtle);
      color: var(--text-muted);
    }
  }
}
</style>

