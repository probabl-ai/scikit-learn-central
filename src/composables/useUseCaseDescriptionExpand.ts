import { ref } from 'vue'

/** Shared across UseCaseCard instances on the use-cases page: one expanded/collapsed mode for synopses. */
const useCaseDescriptionsExpanded = ref(false)

export function useUseCaseDescriptionExpand() {
  function toggleUseCaseDescriptionsExpanded(): void {
    useCaseDescriptionsExpanded.value = !useCaseDescriptionsExpanded.value
  }

  function setUseCaseDescriptionsExpanded(value: boolean): void {
    useCaseDescriptionsExpanded.value = value
  }

  return {
    useCaseDescriptionsExpanded,
    toggleUseCaseDescriptionsExpanded,
    setUseCaseDescriptionsExpanded,
  }
}
