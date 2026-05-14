<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Package } from '@/types/package'
import { fmt } from '@/utils/format'

const props = defineProps<{
  pkg: Package
  useCaseCount: number
  showFitChip: boolean
  isProbablBoosted: boolean
}>()

const natureClass: Record<string, string> = {
  library: 'badge--library',
  extension: 'badge--extension',
  application: 'badge--application',
}
const scopeClass: Record<string, string> = {
  core: 'badge--core',
  incremental: 'badge--incremental',
  verticalized: 'badge--verticalized',
}

const copied = ref(false)

async function copyInstall(): Promise<void> {
  if (!props.pkg.pypi_name) return
  try {
    await navigator.clipboard.writeText(`pip install ${props.pkg.pypi_name}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    // clipboard unavailable — silent
  }
}

const fitDisplay = computed(() => Math.round(props.pkg.fitBase))
const stars = computed(() => Math.round(props.pkg.fitStars))
const downloads = computed(() => Math.round(props.pkg.fitDownloads))
const ucScore = computed(() => Math.round(props.pkg.fitUseCases))
</script>

<template>
  <article class="card" :data-id="pkg.id">
    <!-- Fit-score chip -->
    <div
      v-if="showFitChip"
      class="card__ranking"
      :class="{ 'card__ranking--probabl': isProbablBoosted }"
    >
      <template v-if="isProbablBoosted">
        <svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Featured by Probabl">
          <circle cx="200" cy="200" r="200" fill="#1E22AA" />
          <path d="M110.452 145.278H141.492C144.142 145.278 145.278 144.142 145.278 141.493V110.452C145.278 107.803 144.142 106.667 141.492 106.667H110.452C107.802 106.667 106.667 107.803 106.667 110.452V141.493C106.667 144.142 107.802 145.278 110.452 145.278Z" fill="#F68D2E" />
          <path d="M110.452 292.001H141.492C144.142 292.001 145.278 290.865 145.278 288.215V257.175C145.278 254.525 144.142 253.39 141.492 253.39H110.452C107.802 253.39 106.667 254.525 106.667 257.175V288.215C106.667 290.865 107.802 292.001 110.452 292.001Z" fill="#F68D2E" />
          <path d="M257.174 292.001H288.214C290.864 292.001 292 290.865 292 288.215V257.175C292 254.525 290.864 253.39 288.214 253.39H257.174C254.524 253.39 253.389 254.525 253.389 257.175V288.215C253.389 290.865 254.524 292.001 257.174 292.001Z" fill="#F68D2E" />
        </svg>
      </template>
      <template v-else>
        {{ fitDisplay }}
      </template>

      <div class="ranking-tooltip" :class="{ 'ranking-tooltip--probabl': isProbablBoosted }">
        <template v-if="isProbablBoosted">
          <div class="ranking-tooltip__title">Featured by :probabl.</div>
          <p class="ranking-tooltip__probabl-body">
            A core project of Probabl, the company behind scikit-learn. It is editorially pinned at the top of the Fit Score ranking — the score shown (stars · downloads · use cases) does not include the ranking boost.
          </p>
          <div class="ranking-tooltip__divider"></div>
        </template>
        <div class="ranking-tooltip__title" :class="{ 'ranking-tooltip__title--fitscore': isProbablBoosted }">Fit Score</div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-star"></i> Stars</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: stars + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ stars }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-download"></i> Downloads</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: downloads + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ downloads }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-lightbulb"></i> Use Cases</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: ucScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ ucScore }}</span>
        </div>
      </div>
    </div>

    <div class="card__name">{{ pkg.name }}</div>

    <div class="badges">
      <span class="badge" :class="natureClass[pkg.nature]">{{ pkg.nature }}</span>
      <span class="badge" :class="scopeClass[pkg.scope]">{{ pkg.scope }}</span>
      <span class="badge badge--license">{{ pkg.license }}</span>
      <span v-if="pkg.version" class="badge badge--version">v{{ pkg.version }}</span>
    </div>

    <p class="card__description">{{ pkg.description }}</p>

    <div class="compat-row">
      <span
        class="compat-pill"
        :class="pkg.provides_estimators ? 'compat-pill--yes' : 'compat-pill--no'"
      >
        {{ pkg.provides_estimators ? '✓' : '✗' }} Provides Estimators
      </span>
      <span
        class="compat-pill"
        :class="pkg.consumes_estimators ? 'compat-pill--yes' : 'compat-pill--no'"
      >
        {{ pkg.consumes_estimators ? '✓' : '✗' }} Consumes Estimators
      </span>
    </div>

    <div class="card__stats">
      <span class="card__stat"><i class="fas fa-star"></i> {{ fmt(pkg.stars) }}</span>
      <span class="card__stat"><i class="fas fa-download"></i> {{ fmt(pkg.downloads) }}/mo</span>
      <span v-if="useCaseCount" class="card__use-cases">
        <i class="fas fa-lightbulb"></i>
        {{ useCaseCount }} use case{{ useCaseCount !== 1 ? 's' : '' }}
      </span>
    </div>

    <div v-if="pkg.tags?.length" class="tag-row">
      <span v-for="t in pkg.tags" :key="t" class="tag" :data-tag="t">{{ t }}</span>
    </div>

    <div v-if="pkg.pypi_name" class="card__install" @click="copyInstall">
      <i class="fas fa-terminal"></i>
      <span>pip install {{ pkg.pypi_name }}</span>
      <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i>
    </div>

    <div class="card__links">
      <a v-if="pkg.website" :href="pkg.website" target="_blank" class="card__link">Homepage</a>
      <a v-if="pkg.repository" :href="pkg.repository" target="_blank" class="card__link">
        <i class="fab fa-github"></i> Repo
      </a>
      <a v-if="pkg.docs" :href="pkg.docs" target="_blank" class="card__link">
        <i class="fas fa-book"></i> Docs
      </a>
    </div>
  </article>
</template>
