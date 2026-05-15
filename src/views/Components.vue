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

const { core, packages } = usePackages()
const { useCases } = useUseCases()
const { releases } = useReleases()

/* ── Sample data picks ───────────────────────────────────── */
const ucCountByPkg = computed(() => {
  const m = new Map<string, number>()
  for (const uc of useCases.value) {
    for (const id of uc.packages) m.set(id, (m.get(id) ?? 0) + 1)
  }
  return m
})

const probablBoosted = computed(() =>
  packages.value.find((p) => p.probabl === true),
)
const regularPkg = computed(() =>
  packages.value.find((p) => !p.probabl),
)
const sampleUseCase = computed(() => useCases.value[0])
const sampleRelease = computed(() => releases.value.find((r) => r.version !== 'future'))
const futureRelease = computed(() => releases.value.find((r) => r.version === 'future'))

/* ── Live FilterDropdown demo ────────────────────────────── */
const demoFilter = ref<Set<string>>(new Set(['library']))
const demoOptions = [
  { value: 'library', label: 'Library', count: 30 },
  { value: 'extension', label: 'Extension', count: 6 },
  { value: 'application', label: 'Application', count: 1 },
] as const

/* ── Modal triggers ──────────────────────────────────────── */
const codeUc = ref<UseCase | null>(null)
const baseOpen = ref(false)
const pkgOpen = ref(false)
const ucOpen = ref(false)
const fbOpen = ref(false)
</script>

<template>
  <div id="view-components" class="view" role="tabpanel" aria-label="Components sandbox">
    <div class="page-content">
      <h1
        style="
          font-family: var(--brand-typography--title);
          font-size: var(--brand-typography-size--heading-h3);
          font-weight: 300;
          margin-bottom: var(--space-2);
        "
      >
        Components sandbox
      </h1>
      <p style="color: var(--text-muted); margin-bottom: var(--space-8)">
        Dev-only mount point for every component, using live data from the
        <code>data/</code> directory. Excluded from production builds via
        <code>import.meta.env.DEV</code>.
      </p>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">FilterDropdown</h2>
        <p class="sandbox-section__hint">
          Selected: <code>{{ [...demoFilter].join(', ') || '(none)' }}</code>
        </p>
        <div style="display: flex; gap: var(--space-3); flex-wrap: wrap">
          <FilterDropdown v-model="demoFilter" label="Nature" :options="demoOptions" />
        </div>
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">SklearnHero</h2>
        <SklearnHero
          :core="core"
          :use-case-count="ucCountByPkg.get('scikit-learn') ?? 0"
        />
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">PackageCard — boosted vs regular</h2>
        <div class="sandbox-grid">
          <PackageCard
            v-if="probablBoosted"
            :pkg="probablBoosted"
            :use-case-count="ucCountByPkg.get(probablBoosted.id) ?? 0"
            :use-cases-filter-to="{ path: '/use-cases', query: { package: probablBoosted.id } }"
            :show-fit-chip="true"
            :is-probabl-boosted="true"
          />
          <PackageCard
            v-if="regularPkg"
            :pkg="regularPkg"
            :use-case-count="ucCountByPkg.get(regularPkg.id) ?? 0"
            :use-cases-filter-to="{ path: '/use-cases', query: { package: regularPkg.id } }"
            :show-fit-chip="true"
            :is-probabl-boosted="false"
          />
        </div>
      </section>

      <!-- ──────────────────────────── -->
      <section v-if="sampleUseCase" class="sandbox-section">
        <h2 class="sandbox-section__title">UseCaseCard</h2>
        <div class="sandbox-grid sandbox-grid--uc">
          <UseCaseCard :use-case="sampleUseCase" @view-code="codeUc = $event" />
        </div>
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">ReleasesBlogStrip</h2>
        <ReleasesBlogStrip />
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">ReleaseCard — past vs future</h2>
        <div class="releases-grid">
          <ReleaseCard v-if="sampleRelease" :release="sampleRelease" />
          <ReleaseCard v-if="futureRelease" :release="futureRelease" />
        </div>
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">Modals (click to open)</h2>
        <div style="display: flex; gap: var(--space-3); flex-wrap: wrap">
          <button class="btn btn--primary" @click="baseOpen = true">BaseModal</button>
          <button
            class="btn btn--primary"
            @click="codeUc = sampleUseCase ?? null"
          >
            CodeModal
          </button>
          <button class="btn btn--primary" @click="pkgOpen = true">SubmitPackageModal</button>
          <button class="btn btn--primary" @click="ucOpen = true">SubmitUseCaseModal</button>
          <button class="btn btn--primary" @click="fbOpen = true">SubmitFeedbackModal</button>
        </div>
      </section>

      <!-- ──────────────────────────── -->
      <section class="sandbox-section">
        <h2 class="sandbox-section__title">FormSuccess</h2>
        <div class="modal" style="position: static; transform: none; max-width: 480px">
          <FormSuccess emoji="🎉" heading="Thank you!" @close="() => {}">
            We received your submission for <strong>example-package</strong>.
          </FormSuccess>
        </div>
      </section>
    </div>
  </div>

  <!-- Render-only-when-open modals (live triggers) -->
  <BaseModal
    :open="baseOpen"
    title="BaseModal demo"
    subtitle="A reusable shell. Press ESC, click outside, or hit ✕ to close."
    @close="baseOpen = false"
  >
    <div class="modal__body">
      <p>Anything can go in the slot — forms, info, confirmations…</p>
    </div>
  </BaseModal>

  <CodeModal :use-case="codeUc" @close="codeUc = null" />
  <SubmitPackageModal :open="pkgOpen" @close="pkgOpen = false" />
  <SubmitUseCaseModal :open="ucOpen" @close="ucOpen = false" />
  <SubmitFeedbackModal :open="fbOpen" @close="fbOpen = false" />
</template>

<style scoped>
.sandbox-section {
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-6);
  border-bottom: 1px dashed var(--neutral-200);
}
.sandbox-section__title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h5);
  font-weight: 300;
  margin-bottom: var(--space-2);
}
.sandbox-section__hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}
.sandbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: var(--space-5);
}
.sandbox-grid--uc {
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
}
</style>
