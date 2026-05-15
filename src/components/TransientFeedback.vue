<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="transient-feedback">
      <div
        v-if="visible"
        class="transient-feedback"
        role="status"
        aria-live="polite"
      >
        <i class="fas fa-check icon" aria-hidden="true"></i>
        <span class="text">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.transient-feedback {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  z-index: 600;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--neutral-200);
  border-left: 3px solid var(--color-orange);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  pointer-events: none;
}

.icon {
  color: var(--color-orange);
  font-size: var(--text-sm);
}

.transient-feedback-enter-active,
.transient-feedback-leave-active {
  transition:
    opacity var(--duration-md) var(--ease-out),
    transform var(--duration-md) var(--ease-out);
}

.transient-feedback-enter-from,
.transient-feedback-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.97);
}

.transient-feedback-enter-to,
.transient-feedback-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
</style>
