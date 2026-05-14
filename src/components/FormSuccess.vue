<script setup lang="ts">
defineProps<{
  emoji: string
  heading: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div style="text-align:center;padding:var(--space-8)">
    <div style="font-size:2rem;margin-bottom:var(--space-4)">{{ emoji }}</div>
    <div
      style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--probabl-blue)"
    >
      {{ heading }}
    </div>
    <p style="color:var(--neutral-600);margin-top:var(--space-3)">
      <slot />
    </p>
    <button
      class="btn btn--primary"
      style="margin-top:var(--space-6)"
      @click="$emit('close')"
    >
      Close
    </button>
  </div>
</template>
