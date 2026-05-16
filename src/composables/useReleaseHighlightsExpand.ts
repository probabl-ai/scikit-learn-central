import { ref } from 'vue'

/** Shared across ReleaseCard instances on the releases page. */
const releaseHighlightsExpanded = ref(false)

export function useReleaseHighlightsExpand() {
  function toggleReleaseHighlightsExpanded(): void {
    releaseHighlightsExpanded.value = !releaseHighlightsExpanded.value
  }

  function setReleaseHighlightsExpanded(value: boolean): void {
    releaseHighlightsExpanded.value = value
  }

  return {
    releaseHighlightsExpanded,
    toggleReleaseHighlightsExpanded,
    setReleaseHighlightsExpanded,
  }
}
