import { ref } from 'vue'

/** Shared across all `PackageCard` instances on the catalog: one expanded/collapsed mode for descriptions. */
const catalogDescriptionsExpanded = ref(false)

export function useCatalogDescriptionExpand() {
  function toggleCatalogDescriptionsExpanded(): void {
    catalogDescriptionsExpanded.value = !catalogDescriptionsExpanded.value
  }

  function setCatalogDescriptionsExpanded(value: boolean): void {
    catalogDescriptionsExpanded.value = value
  }

  return {
    catalogDescriptionsExpanded,
    toggleCatalogDescriptionsExpanded,
    setCatalogDescriptionsExpanded,
  }
}
