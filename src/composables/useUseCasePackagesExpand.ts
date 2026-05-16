import { ref } from 'vue'

/** Shared across UseCaseCard instances: one expanded/collapsed mode for package chips. */
const useCasePackagesExpanded = ref(false)

export function useUseCasePackagesExpand() {
  function toggleUseCasePackagesExpanded(): void {
    useCasePackagesExpanded.value = !useCasePackagesExpanded.value
  }

  function setUseCasePackagesExpanded(value: boolean): void {
    useCasePackagesExpanded.value = value
  }

  return {
    useCasePackagesExpanded,
    toggleUseCasePackagesExpanded,
    setUseCasePackagesExpanded,
  }
}
