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
        <i class="fas fa-check transient-feedback__icon" aria-hidden="true"></i>
        <span class="transient-feedback__text">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>
