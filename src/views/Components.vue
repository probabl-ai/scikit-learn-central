<script setup lang="ts">
import { computed, ref } from 'vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import SklearnHero from '@/components/SklearnHero.vue'
import PackageCard from '@/components/PackageCard.vue'
import UseCaseCard from '@/components/UseCaseCard.vue'
import ReleaseCard from '@/components/ReleaseCard.vue'
import ReleasesBlogStrip from '@/components/ReleasesBlogStrip.vue'
import CodeModal from '@/components/CodeModal.vue'
import BaseModal from '@/components/BaseModal.vue'
import FormSuccess from '@/components/FormSuccess.vue'
import SubmitPackageModal from '@/components/SubmitPackageModal.vue'
import SubmitUseCaseModal from '@/components/SubmitUseCaseModal.vue'
import SubmitFeedbackModal from '@/components/SubmitFeedbackModal.vue'
import { usePackages } from '@/composables/usePackages'
import { useUseCases } from '@/composables/useUseCases'
import { useReleases } from '@/composables/useReleases'
import type { UseCase } from '@/types/usecase'

const { core, packages, featuredPackages } = usePackages()
const { useCases } = useUseCases()
const { releases } = useReleases()

const demoFilter = ref<Set<string>>(new Set(['library']))
const codeUc = ref<UseCase | null>(null)
const baseOpen = ref(false)
const pkgOpen = ref(false)
const ucOpen = ref(false)
const fbOpen = ref(false)

const demoOptions = [
  { value: 'library', label: 'Library', count: 30 },
  { value: 'extension', label: 'Extension', count: 6 },
  { value: 'application', label: 'Application', count: 1 },
] as const

const ucCountByPkg = computed(() => {
  const m = new Map<string, number>()
  for (const uc of useCases.value) {
    for (const id of uc.packages) m.set(id, (m.get(id) ?? 0) + 1)
  }
  return m
})

const packageCardSamples = computed(() => {
  const f = featuredPackages.value
  if (f.length >= 2) return [f[0], f[1]]
  if (f.length === 1) {
    const other = packages.value.find((p) => p.id !== f[0].id)
    return other ? [f[0], other] : [f[0]]
  }
  return packages.value.slice(0, 2)
})
const sampleUseCase = computed(() => useCases.value[0])
const sampleRelease = computed(() => releases.value.find((r) => r.version !== 'future'))
const futureRelease = computed(() => releases.value.find((r) => r.version === 'future'))
</script>

<template>
  <div id="view-components" class="view" role="tabpanel" aria-label="Components sandbox">
    <div class="components-sandbox page-content">
      <h1 class="page-title">Components sandbox</h1>
      <p class="intro">
        Dev-only mount point for every component, using live data from the
        <code>data/</code> directory. Excluded from production builds via
        <code>import.meta.env.DEV</code>.
      </p>

      <section class="sandbox-section">
        <h2 class="section-title">FilterDropdown</h2>
        <p class="section-hint">
          Selected: <code>{{ [...demoFilter].join(', ') || '(none)' }}</code>
        </p>
        <div class="flex-row">
          <FilterDropdown v-model="demoFilter" label="Nature" :options="demoOptions" />
        </div>
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">SklearnHero</h2>
        <SklearnHero
          :core="core"
          :use-case-count="ucCountByPkg.get('scikit-learn') ?? 0"
        />
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">PackageCard — samples</h2>
        <div class="sandbox-grid">
          <PackageCard
            v-for="pkg in packageCardSamples"
            :key="pkg.id"
            :pkg="pkg"
            :use-case-count="ucCountByPkg.get(pkg.id) ?? 0"
            :use-cases-filter-to="{ path: '/use-cases', query: { package: pkg.id } }"
            :show-fit-chip="true"
          />
        </div>
      </section>

      <section v-if="sampleUseCase" class="sandbox-section">
        <h2 class="section-title">UseCaseCard</h2>
        <div class="sandbox-grid sandbox-grid-uc">
          <UseCaseCard :use-case="sampleUseCase" />
        </div>
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">ReleasesBlogStrip</h2>
        <ReleasesBlogStrip />
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">ReleaseCard — past vs future</h2>
        <div class="releases-grid">
          <ReleaseCard v-if="sampleRelease" :release="sampleRelease" />
          <ReleaseCard v-if="futureRelease" :release="futureRelease" />
        </div>
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">Modals (click to open)</h2>
        <div class="flex-row">
          <button class="btn btn--primary" type="button" @click="baseOpen = true">BaseModal</button>
          <button
            class="btn btn--primary"
            type="button"
            @click="codeUc = sampleUseCase ?? null"
          >
            CodeModal
          </button>
          <button class="btn btn--primary" type="button" @click="pkgOpen = true">SubmitPackageModal</button>
          <button class="btn btn--primary" type="button" @click="ucOpen = true">SubmitUseCaseModal</button>
          <button class="btn btn--primary" type="button" @click="fbOpen = true">SubmitFeedbackModal</button>
        </div>
      </section>

      <section class="sandbox-section">
        <h2 class="section-title">FormSuccess</h2>
        <div class="form-success-frame modal">
          <FormSuccess emoji="🎉" heading="Thank you!" @close="() => {}">
            We received your submission for <strong>example-package</strong>.
          </FormSuccess>
        </div>
      </section>
    </div>
  </div>

  <BaseModal
    :open="baseOpen"
    title="BaseModal demo"
    subtitle="A reusable shell. Press ESC, click outside, or hit ✕ to close."
    @close="baseOpen = false"
  >
    <div class="modal-body">
      <p>Anything can go in the slot — forms, info, confirmations…</p>
    </div>
  </BaseModal>

  <CodeModal :use-case="codeUc" @close="codeUc = null" />
  <SubmitPackageModal :open="pkgOpen" @close="pkgOpen = false" />
  <SubmitUseCaseModal :open="ucOpen" @close="ucOpen = false" />
  <SubmitFeedbackModal :open="fbOpen" @close="fbOpen = false" />
</template>

<style scoped>
.components-sandbox {
  .page-title {
    font-family: var(--brand-typography--title);
    font-size: var(--brand-typography-size--heading-h3);
    font-weight: 300;
    margin-bottom: var(--space-2);
  }

  .intro {
    color: var(--text-muted);
    margin-bottom: var(--space-8);
  }

  .flex-row {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .form-success-frame {
    position: static;
    transform: none;
    max-width: 480px;
  }
}

.sandbox-section {
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-6);
  border-bottom: 1px dashed var(--neutral-200);
}

.sandbox-section .section-title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h5);
  font-weight: 300;
  margin-bottom: var(--space-2);
}

.sandbox-section .section-hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.sandbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: var(--space-5);
}

.sandbox-grid-uc {
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
}
</style>
