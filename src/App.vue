<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ViewTabs from '@/components/ViewTabs.vue'
import { usePackages } from '@/composables/usePackages'
import { useUseCases } from '@/composables/useUseCases'

const route = useRoute()
const { packages } = usePackages()
const { useCases } = useUseCases()

const tabCounts = computed(() => ({
  catalog: packages.value.length || null,
  'use-cases': useCases.value.length || null,
  releases: null,
}))

const submitLabel = computed(() => {
  const map: Record<string, string> = {
    catalog: 'Submit Package',
    'use-cases': 'Submit Use Case',
    releases: 'Contribute',
    about: 'Submit Feedback',
  }
  return map[(route.meta.tabKey as string) ?? 'catalog'] ?? 'Submit Package'
})
</script>

<template>
  <AppHeader :submit-label="submitLabel" />
  <ViewTabs :counts="tabCounts" />
  <router-view />
</template>
