<script setup lang="ts">
import { useUseCases } from '@/composables/useUseCases'

const { useCases } = useUseCases()
</script>

<template>
  <main class="catalog-main">
    <div class="state-empty">
      <div class="state-empty__icon">🚧</div>
      <div class="state-empty__title">Use cases view — to be ported</div>
      <p class="state-empty__subtitle">
        {{ useCases.length }} use case{{ useCases.length !== 1 ? 's' : '' }} are loaded and
        ready. This view will be migrated in a follow-up.
      </p>
    </div>
  </main>
</template>
