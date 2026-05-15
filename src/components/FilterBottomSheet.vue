<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const titleId = useId()

function close(): void {
  emit('update:modelValue', false)
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="filter-sheet-portal"
      :class="{ 'filter-sheet-portal--open': modelValue }"
      :aria-hidden="!modelValue"
    >
      <div class="filter-sheet-backdrop" @click="close" />
      <div
        class="filter-sheet-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <div class="filter-sheet-head">
          <h2 :id="titleId" class="filter-sheet-title">{{ title }}</h2>
          <button type="button" class="filter-sheet-close" aria-label="Close" @click="close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="filter-sheet-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="filter-sheet-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.filter-sheet-portal {
  position: fixed;
  inset: 0;
  z-index: 400;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--duration-md) var(--ease-out),
    visibility var(--duration-md) var(--ease-out);
}

.filter-sheet-portal.filter-sheet-portal--open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
}

.filter-sheet-backdrop {
  position: absolute;
  inset: 0;
  background: var(--backdrop-scrim);
}

.filter-sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: min(560px, 88vh);
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border: 1px solid var(--neutral-200);
  border-bottom: none;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: var(--shadow-midnight-panel);
  transform: translateY(100%);
  transition: transform var(--duration-lg) var(--ease-drawer);
}

.filter-sheet-portal.filter-sheet-portal--open .filter-sheet-panel {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .filter-sheet-panel {
    transition: none;
  }
}

.filter-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--neutral-200);
  flex-shrink: 0;
}

.filter-sheet-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.filter-sheet-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color var(--duration-sm) var(--ease),
    background var(--duration-sm) var(--ease);
}

.filter-sheet-close:hover {
  color: var(--text-primary);
  background: var(--neutral-050);
}

.filter-sheet-close:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: 2px;
}

.filter-sheet-body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: var(--space-4) var(--space-5);
}

.filter-sheet-footer {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--neutral-200);
  background: var(--bg-surface);
}
</style>
