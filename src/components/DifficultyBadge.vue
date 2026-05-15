<script setup lang="ts">
import type { Difficulty } from '@/types/usecase'

defineProps<{
  difficulty: Difficulty
}>()
</script>

<template>
  <span class="difficulty-badge" :class="`difficulty-badge--${difficulty}`">{{ difficulty }}</span>
</template>
