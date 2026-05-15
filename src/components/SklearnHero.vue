<script setup lang="ts">
import { computed } from 'vue'
import type { CorePackage } from '@/types/package'
import { fmt } from '@/utils/format'

const props = defineProps<{
  core: CorePackage
  useCaseCount: number
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
</script>

<template>
  <div class="sklearn-hero" id="sklearn-hero">
    <div class="corner-tag">The Core</div>
    <div class="body">
      <div class="content">
        <div class="pill">Core Library — Foundation of the Ecosystem</div>
        <div class="name">{{ core.name }}</div>
        <p class="description">{{ core.description }}</p>

        <div class="badges badges">
          <span class="badge">Library</span>
          <span class="badge badge--core">Core</span>
          <span class="badge badge--license">{{ core.license }}</span>
          <span v-if="version" class="badge">v{{ version }}</span>
        </div>

        <div class="stats">
          <span v-if="core.stars != null" class="stat">
            <i class="fas fa-star"></i> {{ fmt(core.stars) }} stars
          </span>
          <span v-if="forks != null" class="stat">
            <i class="fas fa-code-branch"></i> {{ fmt(forks) }} forks
          </span>
          <span v-if="core.downloads != null" class="stat">
            <i class="fas fa-download"></i> {{ fmt(core.downloads) }}/month
          </span>
          <span class="stat">
            <i class="fas fa-users"></i> {{ fmt(core.contributors_count) }}+ contributors
          </span>
          <span v-if="lastCommit" class="stat">
            <i class="fas fa-code-commit"></i> Last commit {{ lastCommit }}
          </span>
          <span v-if="useCaseCount" class="stat">
            <i class="fas fa-lightbulb"></i> {{ useCaseCount }} use cases
          </span>
        </div>

        <div class="links">
          <a
            v-if="core.website"
            :href="core.website"
            target="_blank"
            class="link filled"
          >
            <i class="fas fa-globe"></i> Homepage
          </a>
          <a v-if="core.repository" :href="core.repository" target="_blank" class="link">
            <i class="fab fa-github"></i> Repo
          </a>
          <a v-if="core.docs" :href="core.docs" target="_blank" class="link">
            <i class="fas fa-book"></i> Docs
          </a>
          <span class="link pip-hint">
            <i class="fas fa-terminal"></i> pip install {{ core.pypi_name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sklearn-hero {
  background: var(--color-midnight);
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

.content {
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
  font-size: var(--brand-typography-size--heading-h2);
  font-weight: 300;
  color: var(--text-inverse);
  letter-spacing: var(--tracking-display);
  line-height: 1.1;
  margin-bottom: var(--space-4);
}

.description {
  font-size: var(--text-md);
  color: var(--text-on-dark-body);
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

a.link:hover {
  background: var(--surface-on-dark-faint);
  border-color: var(--border-on-dark-stronger);
  color: var(--text-inverse);
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

.link.pip-hint {
  cursor: default;
  opacity: 0.7;
  text-transform: none;
}

@media (max-width: 900px) {
  .sklearn-hero {
    padding: var(--space-6) var(--space-5);
  }
}
</style>
