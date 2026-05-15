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

if (import.meta.env.DEV) {
  tabs.push({ key: 'components', to: '/components', icon: 'fa-flask', label: 'Components' })
}

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
        class="tab"
        :class="{ 'is-active': activeKey === tab.key }"
        @click="navigate"
      >
        <i class="fas" :class="tab.icon"></i> {{ tab.label }}
        <span v-if="tab.key !== 'about' && tab.key !== 'components'" class="count">
          {{ countFor(tab.key) }}
        </span>
      </button>
    </router-link>
  </nav>
</template>

<style scoped>
.view-tabs {
  background: var(--color-midnight);
  border-bottom: 1px solid var(--color-midnight-line);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: 0;
}

.tab {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--color-slate);
  text-transform: none;
  padding: var(--space-3) var(--space-5);
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.tab:hover {
  color: var(--overlay-on-dark-soft);
}

.tab.is-active {
  color: var(--text-inverse);
  border-bottom-color: var(--color-orange);
}

.count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--surface-sky-on-dark-muted);
  color: var(--color-sky);
  border-radius: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.tab.is-active .count {
  background: var(--color-orange);
  color: var(--color-near-black);
}

@media (max-width: 640px) {
  .view-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 0 var(--space-3);
  }

  .view-tabs::-webkit-scrollbar {
    display: none;
  }

  .tab {
    padding: var(--space-2) var(--space-3);
    font-size: 11px;
    flex-shrink: 0;
  }
}
</style>
