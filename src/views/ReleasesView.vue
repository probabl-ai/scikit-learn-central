<script setup lang="ts">
import ReleaseCard from '@/components/ReleaseCard.vue'
import ReleasesBlogStrip from '@/components/ReleasesBlogStrip.vue'
import { useReleases } from '@/composables/useReleases'

const { releases } = useReleases()
</script>

<template>
  <div id="view-releases" class="view" role="tabpanel" aria-label="scikit-learn Releases">
    <div class="page-content">
      <ReleasesBlogStrip />
      <div class="releases-grid">
        <ReleaseCard v-for="rel in releases" :key="rel.version" :release="rel" />
      </div>
    </div>
  </div>
</template>
