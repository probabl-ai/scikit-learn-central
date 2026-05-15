<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ViewTabs from '@/components/ViewTabs.vue'
import SubmitPackageModal from '@/components/SubmitPackageModal.vue'
import SubmitUseCaseModal from '@/components/SubmitUseCaseModal.vue'
import SubmitFeedbackModal from '@/components/SubmitFeedbackModal.vue'
import TransientFeedback from '@/components/TransientFeedback.vue'
import { usePackages } from '@/composables/usePackages'
import { useTransientFeedback } from '@/composables/useTransientFeedback'
import { useUseCases } from '@/composables/useUseCases'
import { useReleases } from '@/composables/useReleases'
import { useSubmitModal } from '@/composables/useSubmitModal'

const route = useRoute()
const { packages } = usePackages()
const { useCases } = useUseCases()
const { releaseCount } = useReleases()
const { active: activeModal, open: openModal, close: closeModal } = useSubmitModal()
const { visible: feedbackVisible, message: feedbackMessage } = useTransientFeedback()

const tabCounts = computed(() => ({
  catalog: packages.value.length || null,
  'use-cases': useCases.value.length || null,
  releases: releaseCount.value || null,
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

function onHeaderSubmit(): void {
  const tab = (route.meta.tabKey as string) ?? 'catalog'
  if (tab === 'releases') {
    window.open(
      'https://github.com/scikit-learn/scikit-learn/contribute',
      '_blank',
      'noopener',
    )
    return
  }
  if (tab === 'use-cases') return openModal('use-case')
  if (tab === 'about') return openModal('feedback')
  return openModal('package')
}
</script>

<template>
  <div class="app-root">
    <AppHeader :submit-label="submitLabel" @submit="onHeaderSubmit" />
    <ViewTabs :counts="tabCounts" />
    <router-view />

    <SubmitPackageModal :open="activeModal === 'package'" @close="closeModal" />
    <SubmitUseCaseModal :open="activeModal === 'use-case'" @close="closeModal" />
    <SubmitFeedbackModal :open="activeModal === 'feedback'" @close="closeModal" />
    <TransientFeedback :visible="feedbackVisible" :message="feedbackMessage" />
  </div>
</template>

<style scoped>
.app-root {
  min-width: 0;
}
</style>
