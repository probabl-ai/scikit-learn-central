import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Release } from '@/types/release'
import { useReleaseHighlightsExpand } from '@/composables/useReleaseHighlightsExpand'

export interface ReleaseCardHighlightsProps {
  release: Release
}

function highlightTexts(release: Release): string[] {
  return release.highlights.map((h) => (typeof h === 'string' ? h : h.text))
}

function createProbe(ul: HTMLElement): HTMLUListElement {
  const probe = document.createElement('ul')
  probe.className = ul.className
  const ulStyle = getComputedStyle(ul)
  const sampleLi = ul.querySelector('.highlight') as HTMLElement | null
  const sampleText = ul.querySelector('.highlight-text') as HTMLElement | null
  const liStyle = sampleLi ? getComputedStyle(sampleLi) : null
  const textStyle = sampleText ? getComputedStyle(sampleText) : null

  probe.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    'overflow:visible',
    'width:' + ul.clientWidth + 'px',
    'max-height:none',
    'gap:' + ulStyle.gap,
    'padding:0',
    'margin:0',
    'list-style:none',
    'display:flex',
    'flex-direction:column',
    'font-size:' + (textStyle?.fontSize ?? ulStyle.fontSize),
    'line-height:' + (textStyle?.lineHeight ?? ulStyle.lineHeight),
  ].join(';')
  document.body.appendChild(probe)

  probe.dataset.liPaddingLeft = liStyle?.paddingLeft ?? ''
  probe.dataset.liGap = liStyle?.gap ?? ''
  return probe
}

function appendProbeItem(probe: HTMLUListElement, text: string): HTMLElement {
  const li = document.createElement('li')
  li.className = 'highlight'
  li.style.paddingLeft = probe.dataset.liPaddingLeft ?? ''
  li.style.display = 'flex'
  li.style.alignItems = 'baseline'
  li.style.gap = probe.dataset.liGap ?? ''
  li.style.minWidth = '0'

  const span = document.createElement('span')
  span.className = 'highlight-text'
  span.style.minWidth = '0'
  span.textContent = text

  li.appendChild(span)
  probe.appendChild(li)
  return li
}

export function useReleaseCardHighlights(props: ReleaseCardHighlightsProps) {
  const { releaseHighlightsExpanded, toggleReleaseHighlightsExpanded } =
    useReleaseHighlightsExpand()

  const cardRoot = ref<HTMLElement | null>(null)
  const highlightsRef = ref<HTMLElement | null>(null)
  const visibleItemCount = ref(Number.POSITIVE_INFINITY)

  const highlightsExpanded = computed(() => releaseHighlightsExpanded.value)

  function toggleHighlightsExpanded(): void {
    toggleReleaseHighlightsExpanded()
  }

  const highlightsBodyId = computed(
    () => `release-highlights-${props.release.version.replace(/\./g, '-')}`,
  )

  function measureHighlightsLayout(): void {
    void nextTick(() => {
      requestAnimationFrame(() => {
        const ul = highlightsRef.value
        if (!ul) return

        const texts = highlightTexts(props.release)
        if (texts.length === 0) {
          visibleItemCount.value = 0
          return
        }

        const maxHeightRaw = getComputedStyle(ul).maxHeight
        const maxHeight = parseFloat(maxHeightRaw)
        if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
          visibleItemCount.value = texts.length
          return
        }

        const probe = createProbe(ul)

        let fitCount = 0
        for (let i = 0; i < texts.length; i++) {
          appendProbeItem(probe, texts[i]!)
          if (probe.scrollHeight <= maxHeight + 1) {
            fitCount = i + 1
          } else {
            break
          }
        }

        probe.remove()

        visibleItemCount.value = Math.max(1, fitCount)
      })
    })
  }

  let cardResizeObs: ResizeObserver | null = null

  function setupCardResizeObserver(): void {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    void nextTick(() => {
      const el = cardRoot.value
      if (!el) return
      cardResizeObs = new ResizeObserver(() => measureHighlightsLayout())
      cardResizeObs.observe(el)
    })
  }

  onMounted(() => {
    void nextTick(() => {
      measureHighlightsLayout()
      setupCardResizeObserver()
    })
    window.addEventListener('resize', measureHighlightsLayout)
  })

  onUnmounted(() => {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    window.removeEventListener('resize', measureHighlightsLayout)
  })

  watch(
    () => props.release.version,
    () => {
      visibleItemCount.value = Number.POSITIVE_INFINITY
      void nextTick(() => {
        measureHighlightsLayout()
        setupCardResizeObserver()
      })
    },
  )

  watch(
    () => highlightTexts(props.release).join('\n'),
    () => {
      visibleItemCount.value = Number.POSITIVE_INFINITY
      void nextTick(measureHighlightsLayout)
    },
  )

  watch(highlightsExpanded, () => {
    if (!highlightsExpanded.value) void nextTick(measureHighlightsLayout)
  })

  const highlightsExpandable = computed(
    () => visibleItemCount.value < props.release.highlights.length,
  )

  function shouldShowHighlight(index: number): boolean {
    if (highlightsExpanded.value) return true
    return index < visibleItemCount.value
  }

  const highlightsExpandAriaLabel = computed(() =>
    highlightsExpanded.value
      ? 'Show less — collapse highlights on all releases'
      : 'Show more — expand highlights on all releases',
  )

  const showHighlightsToggle = computed(
    () => highlightsExpanded.value || highlightsExpandable.value,
  )

  return {
    cardRoot,
    highlightsRef,
    highlightsBodyId,
    highlightsExpanded,
    toggleHighlightsExpanded,
    highlightsExpandAriaLabel,
    showHighlightsToggle,
    shouldShowHighlight,
  }
}
