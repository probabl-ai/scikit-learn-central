<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  subtitle?: string
  /** Max-width override for the inner .modal box (e.g. "600px"). */
  maxWidth?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function close(): void {
  emit('close')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

document.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="modal-backdrop"
    :class="{ 'is-open': open }"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div class="modal" :style="maxWidth ? { maxWidth } : undefined">
      <button class="close" aria-label="Close" @click="close">&times;</button>
      <div class="header">
        <h2 class="title">{{ title }}</h2>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop-scrim);
  z-index: 500;
  overflow-y: auto;
  padding: var(--space-8) var(--space-5);

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity var(--duration-lg) var(--ease-out),
    visibility var(--duration-lg);
}

.modal-backdrop.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.modal {
  background: var(--bg-surface);
  max-width: 580px;
  margin: 0 auto;
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  position: relative;

  transform: scale(0.97);
  transition: transform var(--duration-lg) var(--ease-out);
}

.modal-backdrop.is-open .modal {
  transform: scale(1);
}

.close {
  position: absolute;
  top: var(--space-5);
  right: var(--space-6);
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-sm) var(--ease);
}

.close:hover {
  color: var(--text-primary);
}

.title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-2);
  line-height: 1.1;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.modal :deep(.btn--ghost) {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border-default);
}

.modal :deep(.btn--ghost:hover) {
  background: var(--neutral-100);
  color: var(--text-primary);
  transform: none;
}

:slotted(.modal-footer) {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
