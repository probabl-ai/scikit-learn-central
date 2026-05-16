<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { Package } from '@/types/package'
import type { UseCase } from '@/types/usecase'
import { usePackageCatalogItem } from '@/composables/usePackageCatalogItem'

const props = defineProps<{
  pkg: Package
  useCases?: UseCase[]
  useCaseCount?: number
  showFitChip: boolean
  useCasesFilterTo?: RouteLocationRaw
}>()

const {
  descriptionExpanded,
  toggleDescriptionExpanded,
  descriptionExpandAriaLabel,
  scopeCarouselIndex,
  cardRoot,
  descRef,
  descExpandable,
  copied,
  categoryGroups,
  scopeCarouselLen,
  scopeCarouselTrackStyle,
  descBodyId,
  tagLabels,
  ucTotal,
  useCasesNavigable,
  useCasesBrowseTitle,
  useCasesLinkBind,
  metaRows,
  fitDisplay,
  fitBreakdownRows,
  fitScoreAriaLabel,
  fitScorePillStyle,
  isTierRedundant,
  scopeChipTitle,
  scopeCarouselPrev,
  scopeCarouselNext,
  copyInstall,
} = usePackageCatalogItem(props)

const tagsViewportEl = ref<HTMLElement | null>(null)
const tagsCarouselCanPrev = ref(false)
const tagsCarouselCanNext = ref(false)

let tagsResizeObs: ResizeObserver | null = null

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

onUnmounted(() => {
  tagsResizeObs?.disconnect()
  tagsResizeObs = null
})

watch(
  [tagsViewportEl, () => props.pkg.id, () => [...(props.pkg.tags ?? [])]],
  () => setupTagsResizeObserver(),
  { flush: 'post' },
)

defineExpose({ cardRoot, descRef })
</script>

<template>
  <article ref="cardRoot" class="card pkg-catalog-item" :data-id="pkg.id">
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

      <div class="synopsis" :class="{ 'synopsis--collapsed': !descriptionExpanded }">
        <p
          :id="descBodyId"
          ref="descRef"
          class="synopsis-text"
          :class="{ 'synopsis-text--clamped': !descriptionExpanded }"
        >
          {{ pkg.description }}
        </p>
        <button
          v-if="descriptionExpanded || descExpandable"
          type="button"
          class="synopsis-toggle"
          :aria-expanded="descriptionExpanded"
          :aria-controls="descBodyId"
          :aria-label="descriptionExpandAriaLabel"
          @click="toggleDescriptionExpanded"
        >
          {{ descriptionExpanded ? 'Show less' : 'Show more' }}
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
        <a v-if="pkg.website" :href="pkg.website" target="_blank" class="outbound-link">
          <i class="fas fa-house" aria-hidden="true"></i> Homepage
        </a>
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

<style src="@/assets/css/package-catalog-item.css"></style>
<style scoped>
/* Card grid + tag carousel only; shared chrome in package-catalog-item.css */
.pkg-catalog-item.card {
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

  @media (max-width: 640px) {
    .tags-carousel-nav--paged {
      display: none !important;
    }

    .tags-carousel-viewport.tag-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  }
}
</style>

