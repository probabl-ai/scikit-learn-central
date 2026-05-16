<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const ABOUT_TO = { name: 'about', hash: '#ranking-methodology' } as const

const FIT_SCORE_CRITERIA = [
  { key: 'docs', label: 'Docs', definition: 'Getting started, API reference, and guide.' },
  { key: 'testing', label: 'Testing', definition: 'Coverage from codecov, coveralls, or fallback.' },
  { key: 'fitness', label: 'Fitness', definition: 'Appearances in curated use cases.' },
  { key: 'activity', label: 'Activity', definition: 'Recent commits and releases.' },
  { key: 'community', label: 'Community', definition: 'GitHub stars and forks.' },
  { key: 'adoption', label: 'Adoption', definition: 'Monthly PyPI downloads.' },
] as const

const CLOSE_DELAY_MS = 150

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})
const panelId = useId()

function updatePanelPosition(): void {
  const btn = triggerEl.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const gap = 8
  panelStyle.value = {
    top: `${rect.bottom + gap}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

function onLayoutChange(): void {
  if (open.value) updatePanelPosition()
}

let closeTimer: ReturnType<typeof setTimeout> | null = null

function clearCloseTimer(): void {
  if (closeTimer != null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function show(): void {
  clearCloseTimer()
  open.value = true
}

function hideSoon(): void {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    open.value = false
    closeTimer = null
  }, CLOSE_DELAY_MS)
}

function close(): void {
  clearCloseTimer()
  open.value = false
}

function toggle(): void {
  if (open.value) close()
  else show()
}

function prefersHoverPointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function onTriggerClick(): void {
  if (prefersHoverPointer()) return
  toggle()
}

function onFocusOut(e: FocusEvent): void {
  const next = e.relatedTarget as Node | null
  if (next && (root.value?.contains(next) || panelEl.value?.contains(next))) return
  hideSoon()
}

function onDocPointerDown(e: PointerEvent): void {
  if (!open.value) return
  const target = e.target as Node
  if (root.value?.contains(target) || panelEl.value?.contains(target)) return
  close()
}

function onKeydown(e: KeyboardEvent): void {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  updatePanelPosition()
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onLayoutChange, true)
  window.addEventListener('resize', onLayoutChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onLayoutChange, true)
  window.removeEventListener('resize', onLayoutChange)
  clearCloseTimer()
})
</script>

<template>
  <div
    ref="root"
    class="fit-score-help"
    :class="{ 'is-open': open }"
    @mouseenter="show"
    @mouseleave="hideSoon"
    @focusin="show"
    @focusout="onFocusOut"
  >
    <button
      ref="triggerEl"
      type="button"
      class="fit-panel-help"
      :aria-expanded="open"
      :aria-controls="panelId"
      aria-label="What is Fit Score"
      @click="onTriggerClick"
    >
      <i class="fas fa-circle-question" aria-hidden="true"></i>
    </button>
    <Teleport to="body">
      <div
        v-show="open"
        :id="panelId"
        ref="panelEl"
        class="fit-score-help__panel"
        :style="panelStyle"
        role="dialog"
        aria-modal="false"
        aria-labelledby="fit-score-help-title"
        @mouseenter="show"
        @mouseleave="hideSoon"
        @focusin="show"
        @focusout="onFocusOut"
      >
        <p id="fit-score-help-title" class="fit-score-help__title">What is Fit Score</p>
        <ul class="fit-score-help__criteria">
          <li v-for="c in FIT_SCORE_CRITERIA" :key="c.key" class="fit-score-help__criterion">
            <span class="fit-score-help__criterion-name">{{ c.label }}</span>
            <span class="fit-score-help__criterion-def">{{ c.definition }}</span>
          </li>
        </ul>
        <p class="fit-score-help__footer">
          More on the
          <router-link :to="ABOUT_TO" class="fit-score-help__link">
            About page
            <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </router-link>
        </p>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fit-score-help__panel {
  position: fixed;
  z-index: 1000;
  min-width: 14rem;
  max-width: 18rem;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-on-blue);
  box-shadow: var(--shadow-tooltip-layered);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fit-score-help__title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-orange);
}

.fit-score-help__criteria {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.fit-score-help__criterion {
  font-size: 10px;
  line-height: 1.35;
  color: var(--overlay-on-dark-muted);
}

.fit-score-help__criterion-name {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-on-blue);
}

.fit-score-help__criterion-def::before {
  content: ' — ';
}

.fit-score-help__footer {
  margin: 0;
  font-size: var(--text-xs);
  line-height: 1.45;
  color: var(--color-orange);
}

.fit-score-help__link {
  display: inline;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-orange) 55%, transparent);
  text-underline-offset: 2px;
  transition: text-decoration-color var(--duration-sm) var(--ease-out);

  &:hover,
  &:focus-visible {
    text-decoration-color: var(--color-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--color-sky);
    outline-offset: 2px;
    border-radius: 2px;
  }

  i {
    margin-left: 0.15em;
    font-size: 0.85em;
    vertical-align: 0.05em;
  }
}
</style>
