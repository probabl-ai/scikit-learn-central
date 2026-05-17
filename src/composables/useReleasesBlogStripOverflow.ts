import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComputedRef } from 'vue'

const COMPACT_CHROME_MQ = '(max-width: 999px)'
const COLLAPSED_MAX_HEIGHT_PX = 280

export function useReleasesBlogStripOverflow(postCount: ComputedRef<number>) {
  const postsExpanded = ref(false)
  const visiblePostCount = ref(0)
  const isCompactChrome = ref(
    typeof window !== 'undefined' && window.matchMedia(COMPACT_CHROME_MQ).matches,
  )

  const postsPanelRef = ref<HTMLElement | null>(null)
  const postsMeasureRailRef = ref<HTMLElement | null>(null)
  const postsOverflowBtnRef = ref<HTMLElement | null>(null)

  let resizeObs: ResizeObserver | null = null
  let compactMq: MediaQueryList | null = null

  const hiddenPostCount = computed(() =>
    Math.max(0, postCount.value - visiblePostCount.value),
  )

  const showPostsToggle = computed(
    () => postsExpanded.value || hiddenPostCount.value > 0,
  )

  function parseGapPx(rail: HTMLElement): number {
    const style = getComputedStyle(rail)
    return Number.parseFloat(style.columnGap || style.gap) || 12
  }

  function moreBtnWidth(total: number): number {
    return (
      postsOverflowBtnRef.value?.offsetWidth ??
      Math.max(88, 72 + String(Math.max(1, total - 1)).length * 7)
    )
  }

  function moreBtnHeight(): number {
    return postsOverflowBtnRef.value?.offsetHeight ?? 36
  }

  function sumRowWidth(items: NodeListOf<HTMLElement>, count: number, gap: number): number {
    let used = 0
    for (let i = 0; i < count; i++) {
      used += (i > 0 ? gap : 0) + items[i].offsetWidth
    }
    return used
  }

  function blockHeight(items: NodeListOf<HTMLElement>, count: number): number {
    if (count <= 0) return 0
    const first = items[0]
    const last = items[count - 1]
    return last.offsetTop + last.offsetHeight - first.offsetTop
  }

  function measureByWidth(
    items: NodeListOf<HTMLElement>,
    total: number,
    panel: HTMLElement,
    rail: HTMLElement,
  ): void {
    const available = panel.clientWidth
    if (available <= 0) return

    const gap = parseGapPx(rail)
    const moreW = moreBtnWidth(total)
    let count = 0
    let used = 0

    for (let i = 0; i < items.length; i++) {
      const w = items[i].offsetWidth
      const add = (count > 0 ? gap : 0) + w
      const isLast = i === items.length - 1

      if (isLast) {
        if (used + add <= available + 0.5) {
          visiblePostCount.value = total
          return
        }
        if (count === 0) {
          visiblePostCount.value = 1
          return
        }
        break
      }

      if (used + add + gap + moreW > available + 0.5) break

      used += add
      count++
    }

    if (count < total && count > 0) {
      while (count > 1) {
        if (sumRowWidth(items, count, gap) + gap + moreW <= available + 0.5) break
        count--
      }
    }

    visiblePostCount.value = count > 0 ? count : total > 0 ? 1 : 0
  }

  function measureByHeight(items: NodeListOf<HTMLElement>, total: number, rail: HTMLElement): void {
    const gap = parseGapPx(rail)
    const moreH = moreBtnHeight()
    const maxHeight = COLLAPSED_MAX_HEIGHT_PX
    let count = 0

    for (let i = 0; i < items.length; i++) {
      const height = blockHeight(items, i + 1)
      const isLast = i === items.length - 1

      if (isLast) {
        if (height <= maxHeight + 0.5) {
          visiblePostCount.value = total
          return
        }
        count = Math.max(1, i)
        break
      }

      if (height + gap + moreH > maxHeight + 0.5) {
        count = Math.max(1, i)
        break
      }

      count = i + 1
    }

    if (count < total && count > 0) {
      while (count > 1) {
        if (blockHeight(items, count) + gap + moreH <= maxHeight + 0.5) break
        count--
      }
    }

    visiblePostCount.value = count > 0 ? count : total > 0 ? 1 : 0
  }

  function measureVisiblePosts(): void {
    void nextTick(() => {
      requestAnimationFrame(() => {
        const total = postCount.value
        if (total === 0) {
          visiblePostCount.value = 0
          return
        }

        if (postsExpanded.value) {
          visiblePostCount.value = total
          return
        }

        const panel = postsPanelRef.value
        const rail = postsMeasureRailRef.value
        if (!panel || !rail) return

        const items = rail.querySelectorAll<HTMLElement>('[data-post-measure]')
        if (!items.length) return

        if (isCompactChrome.value) {
          measureByHeight(items, total, rail)
        } else {
          measureByWidth(items, total, panel, rail)
        }
      })
    })
  }

  function togglePostsExpanded(): void {
    postsExpanded.value = !postsExpanded.value
  }

  function onCompactChromeChange(e: MediaQueryListEvent): void {
    isCompactChrome.value = e.matches
    measureVisiblePosts()
  }

  watch(
    postCount,
    (n) => {
      if (postsExpanded.value) {
        visiblePostCount.value = n
      } else if (visiblePostCount.value === 0 && n > 0) {
        visiblePostCount.value = n
      }
      measureVisiblePosts()
    },
    { immediate: true },
  )
  watch(postsExpanded, () => measureVisiblePosts())
  watch(showPostsToggle, (show) => {
    if (show) measureVisiblePosts()
  })

  onMounted(() => {
    compactMq = window.matchMedia(COMPACT_CHROME_MQ)
    compactMq.addEventListener('change', onCompactChromeChange)

    resizeObs = new ResizeObserver(() => measureVisiblePosts())
    if (postsPanelRef.value) resizeObs.observe(postsPanelRef.value)

    measureVisiblePosts()
  })

  onUnmounted(() => {
    compactMq?.removeEventListener('change', onCompactChromeChange)
    resizeObs?.disconnect()
  })

  watch(postsPanelRef, (el, prev) => {
    if (!resizeObs) return
    if (prev) resizeObs.unobserve(prev)
    if (el) resizeObs.observe(el)
  })

  return {
    postsExpanded,
    visiblePostCount,
    isCompactChrome,
    postsPanelRef,
    postsMeasureRailRef,
    postsOverflowBtnRef,
    hiddenPostCount,
    showPostsToggle,
    measureVisiblePosts,
    togglePostsExpanded,
  }
}
