<template>
  <div class="catalog-list-shell">
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
<style scoped>
/* Layout + junction tokens live in catalog-list-layout.css (imported above). */
</style>
