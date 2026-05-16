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

function onPulseAnimationEnd(event: AnimationEvent): void {
  if (!props.pulsing || event.animationName !== 'uc-focus-pulse') return
  emit('pulseEnd')
}

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
      'is-focused': focused,
      'is-focus-pulse': pulsing,
    }"
    :data-uc-id="useCase.slug"
    @animationend="onPulseAnimationEnd"
  >
    <div class="difficulty-wrap">
      <DifficultyBadge :difficulty="useCase.difficulty" />
    </div>

    <div class="title">{{ useCase.title }}</div>

    <p
      class="synopsis"
      :class="{ 'is-expanded': focused }"
      @click="($event.currentTarget as HTMLElement).classList.toggle('is-expanded')"
    >
      {{ useCase.synopsis }}
    </p>

    <div class="tags">
      <span v-for="i in useCase.industry" :key="i" class="industry-tag">{{ i }}</span>
      <span v-for="t in useCase.technique" :key="t" class="technique-tag">
        {{ t.replace(/-/g, ' ') }}
      </span>
    </div>

    <div class="packages">
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

    <div class="footer">
      <button
        class="copy-link"
        :class="{ 'is-copied': copied }"
        :title="copyLinkLabel"
        :aria-label="copyLinkLabel"
        @click="copyLink"
      >
        <i class="fas" :class="copied ? 'fa-check' : 'fa-link'"></i>
      </button>
      <div class="actions">
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
          class="btn btn--primary btn--open-lab"
          title="Open this use case in JupyterLite (Pyodide kernel, runs in your browser)"
        >
          <i class="fas fa-flask"></i> Open in JupyterLite
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.uc-card {
  background: var(--bg-surface);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
  cursor: default;
}

.uc-card:hover {
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-md);
}

.uc-card.is-focused {
  border-color: var(--color-orange);
  box-shadow: none;
  transition: border-color 0.18s;
}

.uc-card.is-focused:hover {
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

.uc-card.is-focus-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: uc-focus-pulse 2s ease-in-out forwards;
}

.difficulty-wrap {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
}

.title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 300;
  color: var(--text-primary);
  line-height: 1.25;
  letter-spacing: var(--tracking-tight);
  padding-right: 80px;
}

.synopsis {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--neutral-700);
  line-height: 1.6;
  -webkit-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  overflow: hidden;
  cursor: pointer;
}

.synopsis.is-expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.packages {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-top: var(--space-3);
  border-top: 1px solid var(--neutral-100);
  margin-top: auto;
  gap: var(--space-2);
}

.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.copy-link {
  font-size: var(--text-xs);
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: var(--neutral-500);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition:
    transform var(--duration-press) var(--ease-out),
    color var(--duration-sm) var(--ease-out),
    border-color var(--duration-sm) var(--ease-out),
    background var(--duration-sm) var(--ease-out);
}

.copy-link:active {
  transform: scale(0.97);
}

.copy-link:hover {
  color: var(--color-near-black);
  border-color: var(--color-near-black);
}

.copy-link.is-copied {
  color: var(--color-orange);
  border-color: var(--color-orange);
  background: rgba(255, 121, 0, 0.08);
}

.copy-link.is-copied:hover {
  color: var(--color-orange);
  border-color: var(--color-orange);
}
</style>
