import { nextTick, onUnmounted, watch, type Ref } from 'vue'
import { useUseCasePackagesExpand } from '@/composables/useUseCasePackagesExpand'

const PANEL_SELECTOR = '[data-uc-packages-panel]'

/** Align packages panel height across all use case cards when packages are globally expanded. */
export function useUseCasePackagesPanelHeights(viewRoot: Ref<HTMLElement | null>) {
  const { useCasePackagesExpanded } = useUseCasePackagesExpand()

  let panelResizeObs: ResizeObserver | null = null
  let syncFrame = 0

  function clearExpandedPanelHeight(): void {
    const root = viewRoot.value
    if (!root) return
    root.classList.remove('uc-packages-expanded')
    root.style.removeProperty('--uc-packages-expanded-min-height')
  }

  function syncExpandedPanelHeights(): void {
    const root = viewRoot.value
    if (!root) return

    if (!useCasePackagesExpanded.value) {
      clearExpandedPanelHeight()
      return
    }

    root.classList.add('uc-packages-expanded')
    root.style.removeProperty('--uc-packages-expanded-min-height')

    void nextTick(() => {
      if (syncFrame) cancelAnimationFrame(syncFrame)
      syncFrame = requestAnimationFrame(() => {
        syncFrame = 0
        if (!useCasePackagesExpanded.value) return

        const panels = root.querySelectorAll<HTMLElement>(PANEL_SELECTOR)
        if (!panels.length) return

        let max = 0
        for (const panel of panels) {
          max = Math.max(max, panel.offsetHeight)
        }

        if (max > 0) {
          root.style.setProperty('--uc-packages-expanded-min-height', `${max}px`)
        }
      })
    })
  }

  function disconnectPanelObserver(): void {
    panelResizeObs?.disconnect()
    panelResizeObs = null
  }

  function connectPanelObserver(): void {
    disconnectPanelObserver()
    const root = viewRoot.value
    if (!root || !useCasePackagesExpanded.value) return

    panelResizeObs = new ResizeObserver(() => syncExpandedPanelHeights())
    for (const panel of root.querySelectorAll(PANEL_SELECTOR)) {
      panelResizeObs.observe(panel)
    }
    syncExpandedPanelHeights()
  }

  watch(
    useCasePackagesExpanded,
    (expanded) => {
      if (expanded) connectPanelObserver()
      else {
        disconnectPanelObserver()
        clearExpandedPanelHeight()
      }
    },
    { flush: 'post' },
  )

  watch(viewRoot, (root) => {
    disconnectPanelObserver()
    if (root && useCasePackagesExpanded.value) connectPanelObserver()
  })

  onUnmounted(() => {
    if (syncFrame) cancelAnimationFrame(syncFrame)
    disconnectPanelObserver()
    clearExpandedPanelHeight()
  })

  return { syncExpandedPanelHeights }
}
