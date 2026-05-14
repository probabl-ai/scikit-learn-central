<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  counts: Record<string, number | null>
}>()

const route = useRoute()
const activeKey = computed(() => (route.meta.tabKey as string) ?? 'catalog')

const tabs: Array<{ key: string; to: string; icon: string; label: string }> = [
  { key: 'catalog', to: '/catalog', icon: 'fa-cubes', label: 'Ecosystem Catalog' },
  { key: 'use-cases', to: '/use-cases', icon: 'fa-lightbulb', label: 'Use Cases' },
  { key: 'releases', to: '/releases', icon: 'fa-tag', label: 'scikit-learn releases' },
  { key: 'about', to: '/about', icon: 'fa-info-circle', label: 'About' },
]

function countFor(key: string): string {
  const n = props.counts[key]
  return n == null ? '—' : String(n)
}
</script>

<template>
  <nav class="view-tabs" role="tablist">
    <router-link
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      custom
      v-slot="{ navigate }"
    >
      <button
        type="button"
        role="tab"
        class="view-tab"
        :class="{ 'is-active': activeKey === tab.key }"
        @click="navigate"
      >
        <i class="fas" :class="tab.icon"></i> {{ tab.label }}
        <span v-if="tab.key !== 'about'" class="view-tab__count">{{ countFor(tab.key) }}</span>
      </button>
    </router-link>
  </nav>
</template>
