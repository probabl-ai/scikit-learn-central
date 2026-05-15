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
  <div class="form-success">
    <div class="emoji">{{ emoji }}</div>
    <div class="heading">{{ heading }}</div>
    <p class="body">
      <slot />
    </p>
    <button class="btn btn--primary close-btn" @click="$emit('close')">Close</button>
  </div>
</template>

<style scoped>
.form-success {
  text-align: center;
  padding: var(--space-8);
}

.emoji {
  font-size: 2rem;
  margin-bottom: var(--space-4);
}

.heading {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--probabl-blue);
}

.body {
  color: var(--neutral-600);
  margin-top: var(--space-3);
}

.close-btn {
  margin-top: var(--space-6);
}
</style>
