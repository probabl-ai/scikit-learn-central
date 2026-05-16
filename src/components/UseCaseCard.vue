<script setup lang="ts">
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import { useUseCaseCatalogItem } from '@/composables/useUseCaseCatalogItem'
import type { UseCase } from '@/types/usecase'

const props = withDefaults(
  defineProps<{
    useCase: UseCase
    /** Deep-linked card: permanent orange border + full synopsis. */
    focused?: boolean
    /** Brief breathing ring on arrival. */
    pulsing?: boolean
  }>(),
  { focused: false, pulsing: false },
)

const emit = defineEmits<{
  pulseEnd: []
}>()

const {
  cardRoot,
  descRef,
  descBodyId,
  descriptionExpanded,
  toggleDescriptionExpanded,
  descriptionExpandAriaLabel,
  showSynopsisToggle,
  githubUrl,
  jupyterliteUrl,
  copyLink,
  copied,
  copyLinkLabel,
  classificationRows,
  sortedPackageChips,
  packagesPanelRef,
  packagesMeasureRailRef,
  packagesOverflowBtnRef,
  displayedPackageChips,
  hiddenPackageCount,
  packagesExpanded,
  togglePackagesExpanded,
  packagesExpandAriaLabel,
  showPackagesToggle,
} = useUseCaseCatalogItem(props)

function onPulseAnimationEnd(event: AnimationEvent): void {
  if (!props.pulsing || event.animationName !== 'uc-focus-pulse') return
  emit('pulseEnd')
}
</script>

<template>
  <article
    ref="cardRoot"
    class="card uc-catalog-item"
    :class="{
      'is-focused': focused,
      'is-focus-pulse': pulsing,
    }"
    :data-uc-id="useCase.slug"
    @animationend="onPulseAnimationEnd"
  >
    <div class="stack">
      <div class="headline-row">
        <div class="headline">{{ useCase.title }}</div>
        <DifficultyBadge :difficulty="useCase.difficulty" />
      </div>

      <div class="synopsis" :class="{ 'synopsis--collapsed': !descriptionExpanded }">
        <p
          :id="descBodyId"
          ref="descRef"
          class="synopsis-text"
          :class="{ 'synopsis-text--clamped': !descriptionExpanded }"
        >
          {{ useCase.synopsis }}
        </p>
        <button
          v-if="showSynopsisToggle"
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

      <section class="panel panel--classification" aria-label="Classification">
        <div class="classification-panel-head">
          <span class="classification-panel-eyebrow">CLASSIFICATION</span>
        </div>
        <ul class="classification-meta">
          <li
            v-for="row in classificationRows"
            :key="row.key"
            class="classification-meta-row"
          >
            <span class="classification-meta-label">
              <i class="fas fa-fw classification-meta-icon" :class="row.icon" aria-hidden="true"></i>
              {{ row.label }}
            </span>
            <span class="classification-meta-value" :aria-label="row.sr">{{ row.value }}</span>
          </li>
        </ul>
      </section>

      <section class="panel panel--packages" data-uc-packages-panel aria-label="Packages">
        <div class="packages-panel-head">
          <span class="packages-panel-eyebrow">PACKAGES</span>
        </div>
        <div
          ref="packagesPanelRef"
          class="packages-panel-body"
          :class="{ 'packages-panel-body--collapsed': !packagesExpanded }"
        >
          <div
            ref="packagesMeasureRailRef"
            class="packages-measure-rail"
            aria-hidden="true"
          >
            <span
              v-for="chip in sortedPackageChips"
              :key="`measure-${chip.id}`"
              data-package-measure
              class="uc-package-chip"
              :class="`uc-package-chip--tier-${chip.tier}`"
            >
              {{ chip.label }}
            </span>
          </div>
          <div class="packages-visible-rail">
            <component
              :is="chip.navigable ? 'router-link' : 'span'"
              v-for="chip in displayedPackageChips"
              :key="chip.id"
              v-bind="chip.navigable ? { to: chip.catalogTo } : {}"
              class="uc-package-chip"
              :class="`uc-package-chip--tier-${chip.tier}`"
              :title="chip.browseTitle"
            >
              {{ chip.label }}
            </component>
            <button
              v-if="showPackagesToggle"
              ref="packagesOverflowBtnRef"
              type="button"
              class="packages-overflow-btn"
              :aria-expanded="packagesExpanded"
              :aria-label="packagesExpandAriaLabel"
              @click="togglePackagesExpanded"
            >
              {{ packagesExpanded ? 'Show less' : `+${hiddenPackageCount}` }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="footer">
      <div class="outbound">
        <button
          type="button"
          class="outbound-link"
          :class="{ 'is-copied': copied }"
          :title="copyLinkLabel"
          :aria-label="copyLinkLabel"
          @click="copyLink"
        >
          <i class="fas" :class="copied ? 'fa-check' : 'fa-link'" aria-hidden="true"></i>
          Copy link
        </button>
        <a
          :href="githubUrl"
          target="_blank"
          rel="noopener"
          class="outbound-link"
          title="View on GitHub"
        >
          <i class="fab fa-github" aria-hidden="true"></i> GitHub
        </a>
        <a
          :href="jupyterliteUrl"
          target="_blank"
          rel="noopener"
          class="outbound-link outbound-link--cta"
          title="Open this use case in JupyterLite (Pyodide kernel, runs in your browser)"
        >
          <i class="fas fa-flask" aria-hidden="true"></i> JupyterLite
        </a>
      </div>
    </div>
  </article>
</template>

<style src="@/assets/css/use-case-catalog-item.css"></style>
<style scoped>
.uc-catalog-item.card.is-focused {
  border-color: var(--color-orange);
  box-shadow: none;
  transition: border-color 0.18s;
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
