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
      <button class="modal__close" aria-label="Close" @click="close">&times;</button>
      <div class="modal__header">
        <h2 class="modal__title">{{ title }}</h2>
        <p v-if="subtitle" class="modal__subtitle">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>
