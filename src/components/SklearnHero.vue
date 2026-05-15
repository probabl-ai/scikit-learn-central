<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { Category, CorePackage } from '@/types/package'
import { CATEGORY_META } from '@/types/package'
import { useCopyPipInstall } from '@/composables/useCopyPipInstall'
import { fmt } from '@/utils/format'

const props = defineProps<{
  core: CorePackage
  useCaseCount: number
  useCasesFilterTo?: RouteLocationRaw
}>()

const stats = computed(() => props.core.stats)

const version = computed(() => stats.value?.pypi?.version ?? null)
const forks = computed(() => stats.value?.github?.forks ?? null)
const lastCommit = computed(() => {
  const ts = stats.value?.github?.last_commit
  return ts
    ? new Date(ts).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null
})

const categoryRows = computed(() => {
  const ids = props.core.categories ?? []
  const seen = new Set<Category>()
  const rows: Array<{
    category: Category
    tier: (typeof CATEGORY_META)[Category]['tier']
    tierLabel: string
    label: string
    sourceIndex: number
  }> = []
  let sourceIndex = 0
  for (const c of ids) {
    if (seen.has(c)) continue
    seen.add(c)
    const meta = CATEGORY_META[c]
    rows.push({
      category: c,
      tier: meta.tier,
      tierLabel: meta.tierLabel,
      label: meta.label,
      sourceIndex: sourceIndex++,
    })
  }
  rows.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.sourceIndex - b.sourceIndex))
  return rows.map(({ category, tier, tierLabel, label }) => ({
    category,
    tier,
    tierLabel,
    label,
  }))
})

const categoryBadgeLabels = computed(() => {
  const rows = categoryRows.value
  return [...new Set(rows.map((r) => r.label))]
})

const useCasesLinkTo = computed<RouteLocationRaw | undefined>(() => {
  if (props.useCaseCount <= 0 || props.useCasesFilterTo == null) return undefined
  return props.useCasesFilterTo
})

const { copied, copyInstall } = useCopyPipInstall(() => props.core.pypi_name)
</script>

<template>
  <div class="sklearn-hero" id="sklearn-hero">
    <div class="corner-tag">The Core</div>
    <div class="body">
      <div class="sklearn-hero__main">
        <div class="pill">Core Library — Foundation of the Ecosystem</div>
        <div class="name">{{ core.name }}</div>
        <p class="description">{{ core.description }}</p>

        <div class="badges badges">
          <span v-for="lbl in categoryBadgeLabels" :key="lbl" class="badge">{{ lbl }}</span>
          <span class="badge badge--license">{{ core.license }}</span>
          <span v-if="version" class="badge">v{{ version }}</span>
        </div>

        <div class="stats">
          <span v-if="core.stars != null" class="stat">
            <i class="fas fa-star" aria-hidden="true"></i> {{ fmt(core.stars) }} stars
          </span>
          <span v-if="forks != null" class="stat">
            <i class="fas fa-code-branch" aria-hidden="true"></i> {{ fmt(forks) }} forks
          </span>
          <span v-if="core.downloads != null" class="stat">
            <i class="fas fa-download" aria-hidden="true"></i> {{ fmt(core.downloads) }}/mo
          </span>
          <span class="stat">
            <i class="fas fa-people-group" aria-hidden="true"></i>
            {{ fmt(core.contributors_count) }}+ contributors
          </span>
          <span v-if="lastCommit" class="stat">
            <i class="fas fa-calendar-day" aria-hidden="true"></i> Last commit {{ lastCommit }}
          </span>
          <span v-if="useCaseCount && !useCasesLinkTo" class="stat">
            <i class="fas fa-lightbulb" aria-hidden="true"></i> {{ useCaseCount }} use cases
          </span>
        </div>

        <div class="links">
          <a
            v-if="core.website"
            :href="core.website"
            target="_blank"
            rel="noopener noreferrer"
            class="link filled"
          >
            <i class="fas fa-house" aria-hidden="true"></i> Homepage
          </a>
          <a
            v-if="core.repository"
            :href="core.repository"
            target="_blank"
            rel="noopener noreferrer"
            class="link"
          >
            <i class="fab fa-github" aria-hidden="true"></i> Repo
          </a>
          <a v-if="core.docs" :href="core.docs" target="_blank" rel="noopener noreferrer" class="link">
            <i class="fas fa-book" aria-hidden="true"></i> Docs
          </a>
          <router-link v-if="useCasesLinkTo" :to="useCasesLinkTo" class="link link--use-cases">
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            <span>Use cases ({{ useCaseCount }})</span>
            <i class="fas fa-arrow-up-right-from-square link-use-cases-external" aria-hidden="true"></i>
          </router-link>
          <button
            v-if="core.pypi_name"
            type="button"
            class="link link--pip"
            @click="copyInstall"
          >
            <i class="fas fa-terminal" aria-hidden="true"></i>
            <span>pip install {{ core.pypi_name }}</span>
            <i
              class="fas pip-copy"
              :class="copied ? 'fa-check' : 'fa-copy'"
              aria-hidden="true"
            ></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sklearn-hero {
  background: var(--bg-chrome-nav);
  border: 1px solid var(--color-midnight-line);
  border-radius: var(--radius-md);
  padding: var(--space-8) var(--space-10);
  margin-bottom: var(--space-6);
  position: relative;
  overflow: hidden;
  color: var(--text-inverse);
}

.sklearn-hero::before {
  content: none;
}

.corner-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-orange);
  color: var(--color-near-black);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  padding: 6px 14px;
  white-space: nowrap;
}

.body {
  display: flex;
  gap: var(--space-8);
  align-items: flex-start;
}

.sklearn-hero__main {
  flex: 1;
  min-width: 0;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--color-sky);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  padding: 0;
  margin-bottom: var(--space-3);
}

.pill::before {
  content: '';
  display: inline-block;
  width: 26px;
  height: 16px;
  margin-right: 10px;
  background-image: url('/images/spark.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  vertical-align: middle;
  flex-shrink: 0;
}

.name {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h1);
  font-weight: 300;
  color: var(--text-inverse);
  letter-spacing: var(--tracking-display);
  line-height: 1.1;
  margin-bottom: var(--space-4);
}

.description {
  font-size: var(--text-lg);
  color: var(--color-mist);
  line-height: 1.65;
  max-width: 640px;
  margin-bottom: var(--space-5);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.badges :deep(.badge) {
  background: var(--surface-on-dark-raised);
  color: var(--overlay-on-dark-strong);
  border: 1px solid var(--border-on-dark-default);
}

.stats {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.stat {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-sky);
  display: flex;
  align-items: center;
  gap: 6px;
}

.links {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}

.link {
  padding: 9px 18px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-on-dark-strong);
  color: var(--text-inverse);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  text-decoration: none;
  transition:
    background var(--duration-md) var(--ease-out),
    border-color var(--duration-md) var(--ease-out),
    color var(--duration-md) var(--ease-out);
}

button.link {
  font: inherit;
  cursor: pointer;
  appearance: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

a.link:hover,
button.link.link--pip:hover {
  background: var(--surface-on-dark-faint);
  border-color: var(--border-on-dark-stronger);
  color: var(--text-inverse);
}

.link--use-cases {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.link-use-cases-external {
  flex-shrink: 0;
  font-size: 11px;
  opacity: 0.88;
}

.link--use-cases:hover .link-use-cases-external {
  opacity: 1;
}

.link.filled {
  background: var(--color-orange);
  border-color: var(--color-orange);
  color: var(--color-near-black);
}

.link.filled:hover {
  background: var(--color-orange);
  border-color: var(--color-orange);
  color: var(--color-near-black);
  opacity: 0.92;
}

button.link.link--pip {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}

.link--pip {
  text-transform: none;
}

.link--pip .pip-copy {
  font-size: 12px;
  opacity: 0.85;
}

@media (max-width: 900px) {
  .sklearn-hero {
    padding: max(36px, var(--space-6)) var(--space-5) var(--space-6);
  }
}
</style>
