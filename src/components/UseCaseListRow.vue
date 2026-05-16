<script setup lang="ts">
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import { useUseCaseCatalogItem } from '@/composables/useUseCaseCatalogItem'
import type { UseCase } from '@/types/usecase'

const props = withDefaults(
  defineProps<{
    useCase: UseCase
    focused?: boolean
    pulsing?: boolean
  }>(),
  { focused: false, pulsing: false },
)

const emit = defineEmits<{
  pulseEnd: []
}>()

function onPulseAnimationEnd(event: AnimationEvent): void {
  if (!props.pulsing || event.animationName !== 'uc-focus-pulse') return
  emit('pulseEnd')
}

const {
  descriptionExpanded,
  toggleDescriptionExpanded,
  descriptionExpandAriaLabel,
  cardRoot,
  descRef,
  descExpandable,
  descPreviewBase,
  descBodyId,
  githubUrl,
  jupyterliteUrl,
  copyLink,
  copied,
  copyLinkLabel,
  classificationRows,
  sortedPackageChips,
} = useUseCaseCatalogItem(props, {
  descriptionExpandScope: 'local',
  packagesDisplay: 'wrap',
})

function onDescriptionActivate(): void {
  if (!descExpandable.value && !descriptionExpanded.value) return
  toggleDescriptionExpanded()
}
</script>

<template>
  <article
    ref="cardRoot"
    class="card uc-catalog-item uc-row"
    :class="{
      'is-focused': focused,
      'is-focus-pulse': pulsing,
    }"
    :data-uc-id="useCase.slug"
    @animationend="onPulseAnimationEnd"
  >
    <div class="uc-row-main">
      <div class="uc-row-col uc-row-col--title">
        <div class="uc-row-title-stack">
          <div class="headline">{{ useCase.title }}</div>
          <DifficultyBadge :difficulty="useCase.difficulty" />
          <div class="uc-row-actions" aria-label="External links">
            <button
              type="button"
              class="uc-row-icon-btn"
              :class="{ 'is-copied': copied }"
              :title="copyLinkLabel"
              :aria-label="copyLinkLabel"
              @click="copyLink"
            >
              <i class="fas" :class="copied ? 'fa-check' : 'fa-link'" aria-hidden="true"></i>
              <span class="sr-only">{{ copyLinkLabel }}</span>
            </button>
            <a
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="uc-row-icon-btn"
              title="View on GitHub (opens in a new tab)"
            >
              <i class="fab fa-github" aria-hidden="true"></i>
              <span class="sr-only">GitHub (opens in new tab)</span>
            </a>
            <a
              :href="jupyterliteUrl"
              target="_blank"
              rel="noopener"
              class="uc-row-icon-btn uc-row-icon-btn--cta"
              title="Open in JupyterLite (opens in a new tab)"
            >
              <i class="fas fa-flask" aria-hidden="true"></i>
              <span class="sr-only">JupyterLite (opens in new tab)</span>
            </a>
          </div>
        </div>
      </div>

      <div class="uc-row-col uc-row-col--desc">
        <div class="uc-row-desc synopsis" :class="{ 'synopsis--collapsed': !descriptionExpanded }">
          <p
            :id="descBodyId"
            ref="descRef"
            class="synopsis-text"
            :class="{
              'synopsis-text--clamped': !descriptionExpanded,
              'uc-row-desc-text--interactive': descExpandable || descriptionExpanded,
            }"
            :tabindex="descExpandable || descriptionExpanded ? 0 : undefined"
            :role="descExpandable || descriptionExpanded ? 'button' : undefined"
            :aria-expanded="descExpandable || descriptionExpanded ? descriptionExpanded : undefined"
            :aria-label="descExpandable || descriptionExpanded ? descriptionExpandAriaLabel : undefined"
            :title="
              descExpandable && !descriptionExpanded
                ? 'Click to read the full synopsis'
                : undefined
            "
            @click="onDescriptionActivate"
            @keydown.enter.prevent="onDescriptionActivate"
            @keydown.space.prevent="onDescriptionActivate"
          >
            <template v-if="descriptionExpanded || !descExpandable">
              {{ useCase.synopsis }}
            </template>
            <template v-else>
              {{ descPreviewBase }} <span class="uc-row-desc-ellipsis" aria-hidden="true">…</span>
            </template>
          </p>
        </div>
      </div>

      <div
        v-for="row in classificationRows"
        :key="row.key"
        class="uc-row-col"
        :class="`uc-row-col--${row.key}`"
        :aria-label="`${row.sr}: ${row.value}`"
      >
        <span class="uc-row-taxonomy-value" :title="`${row.label}: ${row.value}`">
          {{ row.value }}
        </span>
      </div>

      <div class="uc-row-col uc-row-col--packages" aria-label="Packages">
        <div v-if="sortedPackageChips.length" class="chip-row chip-row--wrap uc-row-package-chips">
          <component
            :is="chip.navigable ? 'router-link' : 'span'"
            v-for="chip in sortedPackageChips"
            :key="chip.id"
            v-bind="chip.navigable ? { to: chip.catalogTo } : {}"
            class="uc-package-chip"
            :class="`uc-package-chip--tier-${chip.tier}`"
            :title="chip.browseTitle"
          >
            {{ chip.label }}
          </component>
        </div>
        <span v-else class="uc-row-dash">—</span>
      </div>
    </div>
  </article>
</template>

<style src="@/assets/css/use-case-catalog-item.css"></style>
<style src="@/assets/css/use-case-list-layout.css"></style>
<style scoped>
.uc-row-title-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  min-width: 0;
  text-align: center;
}

.uc-row-title-stack .headline {
  width: 100%;
  min-width: 0;
  word-break: break-word;
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  line-height: 1.2;
}

.uc-row-dash {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.uc-row-taxonomy-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--text-secondary);
  line-height: 1.35;
  word-break: break-word;
  text-align: center;
}

.uc-row-package-chips {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  min-width: 0;
}

.uc-row-desc {
  min-width: 0;
  gap: 0;
}

.catalog-list-shell--use-cases .uc-row-col--desc .synopsis.synopsis--collapsed {
  min-height: auto;
}

.catalog-list-shell--use-cases .uc-row-col--desc .synopsis-text--clamped {
  display: block;
  overflow: hidden;
  max-height: calc(1.65em * 3);
  line-height: 1.65;
  -webkit-box-orient: unset;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.uc-row-desc-text--interactive {
  cursor: pointer;
  border-radius: var(--radius-xs, 2px);
}

.uc-row-desc-text--interactive:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: 2px;
}

.uc-row-desc-ellipsis {
  color: var(--color-near-black);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color var(--duration-sm) var(--ease);
}

.uc-row-desc-text--interactive.synopsis-text--clamped:hover .uc-row-desc-ellipsis {
  color: var(--color-orange);
}

.uc-row-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.uc-row-icon-btn {
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
  cursor: pointer;
  transition:
    border-color var(--duration-sm) var(--ease),
    background var(--duration-sm) var(--ease),
    color var(--duration-sm) var(--ease);
}

a.uc-row-icon-btn:hover,
button.uc-row-icon-btn:hover {
  border-color: var(--color-near-black);
  background: var(--surface-accent-subtle-hover);
}

.uc-row-icon-btn.is-copied {
  border-color: var(--color-orange);
  color: var(--color-orange);
}

.uc-row-icon-btn--cta {
  border-color: var(--color-orange);
  color: var(--color-orange);
}

.uc-row-icon-btn i {
  font-size: var(--text-2xs);
  line-height: 1;
}

.uc-catalog-item.card.is-focused {
  border-color: var(--color-orange);
  box-shadow: none;
}

.uc-catalog-item.card.is-focused:hover {
  border-color: var(--color-orange);
  box-shadow: none;
}

@keyframes uc-focus-pulse {
  0% {
    opacity: 1;
    box-shadow: 0 0 0 3px rgba(255, 121, 0, 0.35);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 0 7px rgba(255, 121, 0, 0.18);
  }
  100% {
    opacity: 0;
    box-shadow: 0 0 0 3px rgba(255, 121, 0, 0);
  }
}

.uc-catalog-item.card.is-focus-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: uc-focus-pulse 2s ease-in-out forwards;
}
</style>
