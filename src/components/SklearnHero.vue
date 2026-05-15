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
    <div class="sklearn-hero__corner-tag">The Core</div>
    <div class="sklearn-hero__body">
      <div class="sklearn-hero__content">
        <div class="sklearn-hero__pill">Core Library — Foundation of the Ecosystem</div>
        <div class="sklearn-hero__name">{{ core.name }}</div>
        <p class="sklearn-hero__description">{{ core.description }}</p>

        <div class="sklearn-hero__badges badges">
          <span class="badge">Library</span>
          <span class="badge badge--core">Core</span>
          <span class="badge badge--license">{{ core.license }}</span>
          <span v-if="version" class="badge">v{{ version }}</span>
        </div>

        <div class="sklearn-hero__stats">
          <span v-if="core.stars != null" class="sklearn-hero__stat">
            <i class="fas fa-star"></i> {{ fmt(core.stars) }} stars
          </span>
          <span v-if="forks != null" class="sklearn-hero__stat">
            <i class="fas fa-code-branch"></i> {{ fmt(forks) }} forks
          </span>
          <span v-if="core.downloads != null" class="sklearn-hero__stat">
            <i class="fas fa-download"></i> {{ fmt(core.downloads) }}/month
          </span>
          <span class="sklearn-hero__stat">
            <i class="fas fa-users"></i> {{ fmt(core.contributors_count) }}+ contributors
          </span>
          <span v-if="lastCommit" class="sklearn-hero__stat">
            <i class="fas fa-code-commit"></i> Last commit {{ lastCommit }}
          </span>
          <span v-if="useCaseCount" class="sklearn-hero__stat">
            <i class="fas fa-lightbulb"></i> {{ useCaseCount }} use cases
          </span>
        </div>

        <div class="sklearn-hero__links">
          <a v-if="core.website" :href="core.website" target="_blank" class="sklearn-hero__link sklearn-hero__link--filled">
            <i class="fas fa-globe"></i> Homepage
          </a>
          <a v-if="core.repository" :href="core.repository" target="_blank" class="sklearn-hero__link">
            <i class="fab fa-github"></i> Repo
          </a>
          <a v-if="core.docs" :href="core.docs" target="_blank" class="sklearn-hero__link">
            <i class="fas fa-book"></i> Docs
          </a>
          <span class="sklearn-hero__link" style="cursor:default;opacity:.7;text-transform:none;">
            <i class="fas fa-terminal"></i> pip install {{ core.pypi_name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
