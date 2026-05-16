<script setup lang="ts">
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
  cardRoot,
  descRef,
  descExpandable,
  descPreviewBase,
  categoryGroups,
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
} = usePackageCatalogItem(props, { descriptionExpandScope: 'local' })

function onDescriptionActivate(): void {
  if (!descExpandable.value && !descriptionExpanded.value) return
  toggleDescriptionExpanded()
}
</script>

<template>
  <article ref="cardRoot" class="card pkg-catalog-item pkg-row" :data-id="pkg.id">
    <div class="pkg-row-main">
      <div class="pkg-row-col pkg-row-col--skore">
        <div class="pkg-row-skore-stack">
          <div class="headline">{{ pkg.name }}</div>
          <div
            v-if="showFitChip"
            class="fit-score-pill"
            :style="fitScorePillStyle"
            :aria-label="fitScoreAriaLabel"
          >
            <span class="fit-score-pill__value">{{ fitDisplay }}</span>
          </div>
          <span v-else class="pkg-row-dash" aria-hidden="true">—</span>
          <div class="pkg-skore-actions" aria-label="External links">
            <a
              v-if="pkg.website"
              :href="pkg.website"
              target="_blank"
              rel="noopener noreferrer"
              class="pkg-skore-icon-btn"
              title="Project website (opens in a new tab)"
            >
              <i class="fas fa-house" aria-hidden="true"></i>
              <span class="sr-only">Homepage (opens in new tab)</span>
            </a>
            <span
              v-else
              class="pkg-skore-icon-btn pkg-skore-icon-btn--disabled"
              role="img"
              aria-label="Homepage not listed"
              title="No homepage URL is listed for this package"
            >
              <i class="fas fa-house" aria-hidden="true"></i>
            </span>
            <a
              v-if="pkg.repository"
              :href="pkg.repository"
              target="_blank"
              rel="noopener noreferrer"
              class="pkg-skore-icon-btn"
              title="Source code repository (opens in a new tab)"
            >
              <i class="fab fa-github" aria-hidden="true"></i>
              <span class="sr-only">Repository (opens in new tab)</span>
            </a>
            <span
              v-else
              class="pkg-skore-icon-btn pkg-skore-icon-btn--disabled"
              role="img"
              aria-label="Repository not listed"
              title="No repository URL is listed for this package"
            >
              <i class="fab fa-github" aria-hidden="true"></i>
            </span>
            <a
              v-if="pkg.docs"
              :href="pkg.docs"
              target="_blank"
              rel="noopener noreferrer"
              class="pkg-skore-icon-btn"
              title="Package documentation (opens in a new tab)"
            >
              <i class="fas fa-book" aria-hidden="true"></i>
              <span class="sr-only">Documentation (opens in new tab)</span>
            </a>
            <span
              v-else
              class="pkg-skore-icon-btn pkg-skore-icon-btn--disabled"
              role="img"
              aria-label="Documentation not listed"
              title="No documentation URL is listed for this package"
            >
              <i class="fas fa-book" aria-hidden="true"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="pkg-row-col pkg-row-col--desc">
        <div class="pkg-row-desc synopsis" :class="{ 'synopsis--collapsed': !descriptionExpanded }">
          <p
            :id="descBodyId"
            ref="descRef"
            class="synopsis-text"
            :class="{
              'synopsis-text--clamped': !descriptionExpanded,
              'pkg-row-desc-text--interactive': descExpandable || descriptionExpanded,
            }"
            :tabindex="descExpandable || descriptionExpanded ? 0 : undefined"
            :role="descExpandable || descriptionExpanded ? 'button' : undefined"
            :aria-expanded="descExpandable || descriptionExpanded ? descriptionExpanded : undefined"
            :aria-label="descExpandable || descriptionExpanded ? descriptionExpandAriaLabel : undefined"
            :title="
              descExpandable && !descriptionExpanded
                ? 'Click to read the full description'
                : undefined
            "
            @click="onDescriptionActivate"
            @keydown.enter.prevent="onDescriptionActivate"
            @keydown.space.prevent="onDescriptionActivate"
          >
            <template v-if="descriptionExpanded || !descExpandable">
              {{ pkg.description }}
            </template>
            <template v-else>
              {{ descPreviewBase }} <span class="pkg-row-desc-ellipsis" aria-hidden="true">…</span>
            </template>
          </p>
        </div>
      </div>

      <div class="pkg-row-col pkg-row-col--cats" aria-label="Workflow categories">
        <div v-if="categoryGroups.length" class="pkg-row-cats">
          <div
            v-for="g in categoryGroups"
            :key="`${pkg.id}-cat-${g.category}`"
            class="pkg-row-cat-line"
            :title="scopeChipTitle(g)"
          >
            <span class="pkg-row-cat-tier" :class="`pkg-row-cat-tier--${g.tier}`">{{ g.tierLabel }}</span>
            <span v-if="!isTierRedundant(g)" class="pkg-row-cat-sub">{{ g.subLabels.join(' · ') }}</span>
          </div>
        </div>
        <span v-else class="pkg-row-dash">—</span>
      </div>

      <div
        v-for="row in metaRows"
        :key="`${pkg.id}-stat-${row.key}`"
        class="pkg-row-col pkg-row-col--stat"
        :aria-label="`${row.sr}${row.value}`"
      >
        <span class="pkg-row-stat-val">{{ row.value }}</span>
      </div>

      <template v-if="showFitChip">
        <div
          v-for="row in fitBreakdownRows"
          :key="`${pkg.id}-fitn-${row.key}`"
          class="pkg-row-col pkg-row-col--fitn"
          :aria-label="`${row.label}: ${row.pct}`"
        >
          <span class="pkg-row-fit-num">{{ row.pct }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="i in 3" :key="`${pkg.id}-fitn-empty-${i}`" class="pkg-row-col pkg-row-col--fitn">
          <span class="pkg-row-dash">—</span>
        </div>
      </template>

      <div class="pkg-row-col pkg-row-col--uc" aria-label="Curated use cases">
        <component
          :is="useCasesNavigable ? 'router-link' : 'div'"
          v-if="ucTotal > 0"
          v-bind="useCasesLinkBind"
          class="pkg-row-uc"
          :class="{ 'pkg-row-uc--static': !useCasesNavigable }"
          :aria-label="useCasesBrowseTitle"
        >
          <span class="pkg-row-uc-num">{{ ucTotal }}</span>
          <span class="pkg-row-uc-label">use cases</span>
          <i
            v-if="useCasesNavigable"
            class="fas fa-arrow-up-right-from-square pkg-row-uc-external"
            aria-hidden="true"
          ></i>
        </component>
        <div v-else class="pkg-row-uc pkg-row-uc--empty" :aria-label="`No curated use cases for ${pkg.name}`">
          <span class="pkg-row-uc-num">0</span>
          <span class="pkg-row-uc-label">use cases</span>
        </div>
      </div>

      <div class="pkg-row-col pkg-row-col--tags" aria-label="Tags">
        <div v-if="tagLabels.length" class="chip-row chip-row--wrap pkg-row-tag-chips">
          <span v-for="(t, idx) in tagLabels" :key="`${pkg.id}-tag-${idx}`" class="task-chip">{{ t }}</span>
        </div>
        <span v-else class="tag-empty pkg-row-tag-empty">No tags</span>
      </div>

    </div>
  </article>
</template>

<style src="@/assets/css/package-catalog-item.css"></style>
<style scoped>
.pkg-row-skore-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  min-width: 0;
  text-align: center;
}

.pkg-row-skore-stack .headline {
  width: 100%;
  min-width: 0;
  word-break: break-word;
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  line-height: 1.2;
}

.pkg-row-dash {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.pkg-row-cats {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-2xs);
  line-height: 1.35;
}

.pkg-row-cat-line {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  word-break: break-word;
}

.pkg-row-cat-tier {
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: var(--text-2xs);
}

.pkg-row-cat-tier--1 {
  color: var(--color-sky);
}

.pkg-row-cat-tier--2 {
  color: var(--color-orange);
}

.pkg-row-cat-tier--3 {
  color: var(--color-midnight-2);
}

.pkg-row-cat-sub {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}

.pkg-row-stat-val {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  word-break: break-word;
  line-height: 1.25;
}

.pkg-row-fit-num {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.pkg-row-uc {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 100%;
  padding: var(--space-1);
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-sm);
  transition: background var(--duration-sm) var(--ease);
}

.pkg-row-uc:not(.pkg-row-uc--static):not(.pkg-row-uc--empty):hover {
  background: var(--surface-accent-subtle-hover);
}

.pkg-row-uc--static,
.pkg-row-uc--empty {
  cursor: default;
}

.pkg-row-uc-num {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text-primary);
}

.pkg-row-uc-label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-align: center;
}

.pkg-row-uc-external {
  font-size: var(--text-2xs);
  color: var(--blue-600);
  margin-top: var(--space-1);
}

.pkg-row-uc--empty .pkg-row-uc-num {
  color: var(--text-muted);
}

.pkg-row-tag-chips {
  align-content: flex-start;
}

.pkg-row-tag-empty {
  font-size: var(--text-2xs);
  margin: 0;
}

.pkg-row-desc {
  min-width: 0;
  gap: 0;
}

.catalog-list-shell .pkg-row-col--desc .synopsis.synopsis--collapsed {
  min-height: auto;
}

.catalog-list-shell .pkg-row-col--desc .synopsis-text--clamped {
  display: block;
  overflow: hidden;
  max-height: calc(1.65em * 3);
  line-height: 1.65;
  -webkit-box-orient: unset;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.pkg-row-desc-text--interactive {
  cursor: pointer;
  border-radius: var(--radius-xs, 2px);
}

.pkg-row-desc-text--interactive:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: 2px;
}

/* Inline link-styled ellipsis immediately after the last visible word. */
.pkg-row-desc-ellipsis {
  color: var(--color-near-black);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color var(--duration-sm) var(--ease);
}

.pkg-row-desc-text--interactive.synopsis-text--clamped:hover .pkg-row-desc-ellipsis {
  color: var(--color-orange);
}

.pkg-skore-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.pkg-skore-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-sizing: border-box;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  text-decoration: none;
  transition:
    border-color var(--duration-sm) var(--ease),
    background var(--duration-sm) var(--ease),
    color var(--duration-sm) var(--ease);
}

a.pkg-skore-icon-btn:hover {
  border-color: var(--color-near-black);
  background: var(--surface-accent-subtle-hover);
}

.pkg-skore-icon-btn--disabled {
  pointer-events: none;
  opacity: 0.32;
  cursor: default;
}

.pkg-skore-icon-btn i {
  font-size: var(--text-2xs);
  line-height: 1;
}
</style>
