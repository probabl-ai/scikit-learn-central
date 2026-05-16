<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'packages' | 'use-cases'
  }>(),
  { variant: 'packages' },
)
</script>

<template>
  <div
    class="catalog-list-shell"
    :class="{ 'catalog-list-shell--use-cases': variant === 'use-cases' }"
  >
    <div class="catalog-list-scroll">
      <slot />
    </div>
    <span class="catalog-list-junction catalog-list-junction--tl" aria-hidden="true"></span>
    <span class="catalog-list-junction catalog-list-junction--tr" aria-hidden="true"></span>
    <span class="catalog-list-junction catalog-list-junction--bl" aria-hidden="true"></span>
    <span class="catalog-list-junction catalog-list-junction--br" aria-hidden="true"></span>
  </div>
</template>

<style src="@/assets/css/catalog-list-layout.css"></style>
<style src="@/assets/css/use-case-list-layout.css"></style>
<style scoped>
/* Layout + junction tokens live in catalog-list-layout.css (imported above). */
</style>
