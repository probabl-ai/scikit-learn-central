<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import { useTransientFeedback } from '@/composables/useTransientFeedback'
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

const router = useRouter()
const { show: showFeedback } = useTransientFeedback()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const copyLinkLabel = computed(() =>
  copied.value ? 'Link copied' : 'Copy link to this use case',
)

function onPulseAnimationEnd(event: AnimationEvent): void {
  if (!props.pulsing || event.animationName !== 'uc-focus-pulse') return
  emit('pulseEnd')
}

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

async function copyLink(): Promise<void> {
  const { href } = router.resolve({
    name: 'use-cases',
    query: { slug: props.useCase.slug },
  })
  const url = `${window.location.origin}${window.location.pathname}${href}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = undefined
    }, 1200)
    showFeedback('Link copied')
  } catch {
    // silent
  }
}
</script>

<template>
  <article
    class="uc-card"
    :class="{
      'uc-card--focused': focused,
      'uc-card--focus-pulse': pulsing,
    }"
    :data-uc-id="useCase.slug"
    @animationend="onPulseAnimationEnd"
  >
    <div class="uc-card__difficulty">
      <DifficultyBadge :difficulty="useCase.difficulty" />
    </div>

    <div class="uc-card__title">{{ useCase.title }}</div>

    <p
      class="uc-card__synopsis"
      :class="{ 'is-expanded': focused }"
      @click="($event.currentTarget as HTMLElement).classList.toggle('is-expanded')"
    >
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
      <button
        class="uc-card__copy-link"
        :class="{ 'uc-card__copy-link--copied': copied }"
        :title="copyLinkLabel"
        :aria-label="copyLinkLabel"
        @click="copyLink"
      >
        <i class="fas" :class="copied ? 'fa-check' : 'fa-link'"></i>
      </button>
      <div class="uc-card__actions">
        <a
          :href="githubUrl"
          target="_blank"
          rel="noopener"
          class="btn--github-square"
          title="View on GitHub"
          aria-label="View on GitHub"
        >
          <i class="fab fa-github"></i>
        </a>
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
