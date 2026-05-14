<script setup lang="ts">
import { computed } from 'vue'
import type { UseCase } from '@/types/usecase'

const props = defineProps<{
  useCase: UseCase
}>()

const emit = defineEmits<{
  'view-code': [useCase: UseCase]
}>()

const githubUrl = computed(
  () =>
    `https://github.com/probabl-ai/scikit-learn-central/blob/main/data/use-cases/${props.useCase.uuid}.py`,
)

/**
 * Deep link into the JupyterLite distribution shipped alongside the Vue
 * build (see scripts/build_jupyterlite.py). Each .py is converted to
 * <uuid>.ipynb and opened in JupyterLab when the user clicks the button.
 * The path is relative so it works regardless of base URL.
 */
const jupyterliteUrl = computed(
  () => `jupyterlite/lab/index.html?path=use-cases/${props.useCase.uuid}.ipynb`,
)

function viewCode(): void {
  emit('view-code', props.useCase)
}

async function copyLink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#/use-cases?slug=${props.useCase.slug}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // silent
  }
}
</script>

<template>
  <article class="uc-card" :data-uc-id="useCase.slug">
    <div class="uc-card__difficulty">
      <span class="difficulty-badge" :class="`difficulty-badge--${useCase.difficulty}`">
        {{ useCase.difficulty }}
      </span>
    </div>

    <div class="uc-card__title">{{ useCase.title }}</div>

    <p class="uc-card__synopsis" @click="($event.currentTarget as HTMLElement).classList.toggle('is-expanded')">
      {{ useCase.synopsis }}
    </p>

    <div class="uc-card__tags">
      <span v-for="i in useCase.industry" :key="i" class="industry-tag">{{ i }}</span>
      <span v-for="t in useCase.technique" :key="t" class="technique-tag">
        {{ t.replace(/-/g, ' ') }}
      </span>
    </div>

    <div class="uc-card__packages">
      <span
        v-for="pid in useCase.packages"
        :key="pid"
        class="uc-package-chip"
        :class="{ 'uc-package-chip--core': pid === 'scikit-learn' }"
        title="Package used in this use case"
      >
        {{ pid }}
      </span>
    </div>

    <div class="uc-card__footer">
      <button class="uc-card__copy-link" title="Copy link to this use case" @click="copyLink">
        <i class="fas fa-link"></i> Copy link
      </button>
      <div class="uc-card__actions">
        <a
          :href="githubUrl"
          target="_blank"
          rel="noopener"
          class="btn--github-square"
          title="View on GitHub"
        >
          <i class="fab fa-github"></i>
        </a>
        <button class="btn--view-code" @click="viewCode">
          <i class="fas fa-code"></i> View Code
        </button>
        <a
          :href="jupyterliteUrl"
          target="_blank"
          rel="noopener"
          class="btn--open-lab"
          title="Open this use case in JupyterLite (Pyodide kernel, runs in your browser)"
        >
          <i class="fas fa-flask"></i> Open in JupyterLite
        </a>
      </div>
    </div>
  </article>
</template>
