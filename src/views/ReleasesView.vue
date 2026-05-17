<script setup lang="ts">
import ReleaseCard from '@/components/ReleaseCard.vue'
import ReleasesBlogStrip from '@/components/ReleasesBlogStrip.vue'
import { useReleaseHighlightsExpand } from '@/composables/useReleaseHighlightsExpand'
import { useReleases } from '@/composables/useReleases'

const { releases } = useReleases()
const { releaseHighlightsExpanded } = useReleaseHighlightsExpand()
</script>

<template>
  <div
    id="view-releases"
    class="view releases-page"
    :class="{ 'releases-page--highlights-expanded': releaseHighlightsExpanded }"
    role="tabpanel"
    aria-label="scikit-learn Releases"
  >
    <div class="page-content">
      <ReleasesBlogStrip />
      <div class="releases-grid">
        <ReleaseCard v-for="rel in releases" :key="rel.version" :release="rel" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.releases-page {
  min-width: 0;
}
</style>
