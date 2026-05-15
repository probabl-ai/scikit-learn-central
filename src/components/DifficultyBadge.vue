<script setup lang="ts">
import type { Difficulty } from '@/types/usecase'

defineProps<{
  difficulty: Difficulty
}>()
</script>

<template>
  <span
    class="difficulty-badge"
    :class="{
      'is-beginner': difficulty === 'beginner',
      'is-intermediate': difficulty === 'intermediate',
      'is-advanced': difficulty === 'advanced',
    }"
  >
    {{ difficulty }}
  </span>
</template>

<style scoped>
.difficulty-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.is-beginner {
  background: var(--diff-beginner-bg);
  color: var(--diff-beginner-text);
}

.is-intermediate {
  background: var(--diff-intermediate-bg);
  color: var(--diff-intermediate-text);
}

.is-advanced {
  background: var(--diff-advanced-bg);
  color: var(--diff-advanced-text);
}
</style>
