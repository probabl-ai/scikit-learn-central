import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { Category, Package } from '@/types/package'
import { CATEGORY_META } from '@/types/package'
import type { UseCase } from '@/types/usecase'
import { useCatalogDescriptionExpand } from '@/composables/useCatalogDescriptionExpand'
import { useCopyPipInstall } from '@/composables/useCopyPipInstall'
import { fmt, formatReleaseDateLong } from '@/utils/format'

export interface CategoryGroup {
  category: Category
  tier: 1 | 2 | 3
  tierLabel: string
  subLabels: string[]
}

export interface PackageCatalogItemProps {
  pkg: Package
  useCases?: UseCase[]
  useCaseCount?: number
  showFitChip: boolean
  useCasesFilterTo?: RouteLocationRaw
}

export interface PackageCatalogItemOptions {
  /** `global`: card grid — one toggle expands all cards. `local`: list row — per row only. */
  descriptionExpandScope?: 'global' | 'local'
  /** `measured`: list row caps tags at 3 lines with +N. `wrap`: show all tags wrapped. */
  tagsDisplay?: 'measured' | 'wrap'
}

export function usePackageCatalogItem(
  props: PackageCatalogItemProps,
  options: PackageCatalogItemOptions = {},
) {
  const expandScope = options.descriptionExpandScope ?? 'global'
  const tagsDisplay = options.tagsDisplay ?? 'wrap'
  const measureTags = tagsDisplay === 'measured'
  const { catalogDescriptionsExpanded, toggleCatalogDescriptionsExpanded } =
    useCatalogDescriptionExpand()
  const localDescriptionExpanded = ref(false)
  const tagsExpanded = ref(false)
  const tagsOverflow = ref(false)
  const visibleTagCount = ref(0)
  const tagsPanelRef = ref<HTMLElement | null>(null)
  const tagsMeasureRailRef = ref<HTMLElement | null>(null)
  const tagsOverflowBtnRef = ref<HTMLButtonElement | null>(null)

  const descriptionExpanded = computed(() =>
    expandScope === 'local'
      ? localDescriptionExpanded.value
      : catalogDescriptionsExpanded.value,
  )

  function toggleDescriptionExpanded(): void {
    if (expandScope === 'local') {
      localDescriptionExpanded.value = !localDescriptionExpanded.value
    } else {
      toggleCatalogDescriptionsExpanded()
    }
  }

  const scopeCarouselIndex = ref(0)
  const cardRoot = ref<HTMLElement | null>(null)
  const descRef = ref<HTMLElement | null>(null)
  const descExpandable = ref(false)
  /** List rows: text shown before the inline link-styled ellipsis. */
  const descPreviewBase = ref('')

  const { copied, copyInstall } = useCopyPipInstall(() => props.pkg.pypi_name)

  let cardResizeObs: ResizeObserver | null = null

  const categoryGroups = computed<CategoryGroup[]>(() => {
    const seen = new Set<Category>()
    const rows: Array<CategoryGroup & { sourceIndex: number }> = []
    let sourceIndex = 0
    for (const c of props.pkg.categories ?? []) {
      if (seen.has(c)) continue
      seen.add(c)
      const meta = CATEGORY_META[c]
      rows.push({
        category: c,
        tier: meta.tier,
        tierLabel: meta.tierLabel,
        subLabels: [meta.label],
        sourceIndex: sourceIndex++,
      })
    }
    rows.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.sourceIndex - b.sourceIndex))
    return rows.map(({ category, tier, tierLabel, subLabels }) => ({
      category,
      tier,
      tierLabel,
      subLabels,
    }))
  })

  const scopeCarouselLen = computed(() => categoryGroups.value.length)

  const scopeCarouselTrackStyle = computed(() => ({
    transform: `translateX(-${scopeCarouselIndex.value * 100}%)`,
  }))

  const descBodyId = computed(() => `pkg-desc-${props.pkg.id}`)

  const tagLabels = computed(() => (props.pkg.tags ?? []).map((t) => t.replace(/-/g, ' ')))

  const displayedTagLabels = computed(() => {
    if (!measureTags) return tagLabels.value
    if (tagsExpanded.value) return tagLabels.value
    if (!tagsOverflow.value) return tagLabels.value
    return tagLabels.value.slice(0, visibleTagCount.value)
  })

  const hiddenTagCount = computed(() =>
    Math.max(0, tagLabels.value.length - displayedTagLabels.value.length),
  )

  function toggleTagsExpanded(): void {
    tagsExpanded.value = !tagsExpanded.value
  }

  const TAG_MAX_LINES = 3

  function chipLineNumber(chip: HTMLElement, lineTops: number[]): number {
    const top = chip.offsetTop
    let idx = lineTops.indexOf(top)
    if (idx === -1) {
      lineTops.push(top)
      idx = lineTops.length - 1
    }
    return idx + 1
  }

  function lineUsedWidth(chips: NodeListOf<HTMLElement>, count: number, lineTop: number, gap: number): number {
    let used = 0
    let onLine = 0
    for (let i = 0; i < count; i++) {
      if (chips[i].offsetTop !== lineTop) continue
      used += (onLine > 0 ? gap : 0) + chips[i].offsetWidth
      onLine++
    }
    return used
  }

  function measureVisibleTags(): void {
    if (!measureTags) return
    void nextTick(() => {
      requestAnimationFrame(() => {
        const total = tagLabels.value.length
        if (total === 0) {
          tagsOverflow.value = false
          visibleTagCount.value = 0
          return
        }

        if (tagsExpanded.value) {
          visibleTagCount.value = total
          return
        }

        const panel = tagsPanelRef.value
        const rail = tagsMeasureRailRef.value
        if (!panel || !rail) return

        const chips = rail.querySelectorAll<HTMLElement>('[data-tag-measure]')
        if (!chips.length) return

        const available = panel.clientWidth
        if (available <= 0) return

        const gap = Number.parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 8
        const moreBtnWidth =
          (tagsOverflowBtnRef.value?.offsetWidth ?? 0) ||
          Math.max(36, 22 + String(total).length * 7)

        const lineTops: number[] = []
        let count = 0

        for (let i = 0; i < chips.length; i++) {
          if (chipLineNumber(chips[i], lineTops) > TAG_MAX_LINES) break
          count++
        }

        if (count < chips.length) {
          while (count > 1) {
            const lastTop = chips[count - 1].offsetTop
            const used = lineUsedWidth(chips, count, lastTop, gap)
            if (used + gap + moreBtnWidth <= available + 0.5) break
            count--
          }

          tagsOverflow.value = true
          visibleTagCount.value = count
          return
        }

        tagsOverflow.value = false
        visibleTagCount.value = total
      })
    })
  }

  const ucTotal = computed(() => props.useCases?.length ?? props.useCaseCount ?? 0)

  const useCasesNavigable = computed(
    () => ucTotal.value > 0 && props.useCasesFilterTo !== undefined && props.useCasesFilterTo !== null,
  )

  const useCasesBrowseTitle = computed(() => {
    const n = ucTotal.value
    if (!n) return ''
    if (useCasesNavigable.value)
      return `Browse the ${n} use case${n !== 1 ? 's' : ''} that use ${props.pkg.name}`
    return `${n} curated use case${n !== 1 ? 's' : ''} for ${props.pkg.name}`
  })

  const useCasesLinkBind = computed(() =>
    useCasesNavigable.value && props.useCasesFilterTo != null ? { to: props.useCasesFilterTo } : {},
  )

  const forks = computed(() => props.pkg.stats?.github?.forks)

  const releaseVersionDisplay = computed(() => (props.pkg.version ? `v${props.pkg.version}` : '—'))

  const releaseDateDisplay = computed(() => {
    const d = formatReleaseDateLong(props.pkg.stats?.pypi?.release_date)
    return d ?? '—'
  })

  const downloadsWithUnit = computed(() => `${fmt(props.pkg.downloads)}/mo`)

  const metaRows = computed(() => [
    {
      key: 'releaseVersion' as const,
      icon: 'fa-tag',
      sr: 'Release version: ',
      value: releaseVersionDisplay.value,
    },
    {
      key: 'releaseDate' as const,
      icon: 'fa-calendar-day',
      sr: 'Release date: ',
      value: releaseDateDisplay.value,
    },
    {
      key: 'license' as const,
      icon: 'fa-scale-balanced',
      sr: 'License: ',
      value: props.pkg.license,
    },
    {
      key: 'forks' as const,
      icon: 'fa-code-branch',
      sr: 'Forks: ',
      value: fmt(forks.value),
    },
    {
      key: 'stars' as const,
      icon: 'fa-star',
      sr: 'Stars: ',
      value: fmt(props.pkg.stars),
    },
    {
      key: 'downloads' as const,
      icon: 'fa-download',
      sr: 'Downloads: ',
      value: downloadsWithUnit.value,
    },
  ])

  const fitDisplay = computed(() => Math.round(props.pkg.fitBase))

  const fitBreakdownRows = computed(() => [
    { key: 'docs' as const, icon: 'fa-book', label: 'Docs', pct: Math.round(props.pkg.fitDocs) },
    { key: 'testing' as const, icon: 'fa-flask', label: 'Testing', pct: Math.round(props.pkg.fitTesting) },
    { key: 'fitness' as const, icon: 'fa-lightbulb', label: 'Fitness', pct: Math.round(props.pkg.fitFitness) },
    { key: 'activity' as const, icon: 'fa-bolt', label: 'Activity', pct: Math.round(props.pkg.fitActivity) },
    { key: 'community' as const, icon: 'fa-code-branch', label: 'Community', pct: Math.round(props.pkg.fitCommunity) },
    { key: 'adoption' as const, icon: 'fa-download', label: 'Adoption', pct: Math.round(props.pkg.fitAdoption) },
  ])

  const fitScoreAriaLabel = computed(() => `Fit score ${fitDisplay.value} out of 100`)

  const fitScorePillStyle = computed(() => {
    const n = fitDisplay.value
    const p = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
    return { '--fit-pct': `${p}%` }
  })

  function isTierRedundant(g: CategoryGroup): boolean {
    return g.subLabels.length === 1 && g.subLabels[0] === g.tierLabel
  }

  function scopeChipTitle(g: CategoryGroup): string {
    if (isTierRedundant(g)) return g.tierLabel
    return `${g.tierLabel}: ${g.subLabels.join(' · ')}`
  }

  function scopeCarouselPrev(): void {
    const n = scopeCarouselLen.value
    if (n <= 1) return
    scopeCarouselIndex.value = (scopeCarouselIndex.value - 1 + n) % n
  }

  function scopeCarouselNext(): void {
    const n = scopeCarouselLen.value
    if (n <= 1) return
    scopeCarouselIndex.value = (scopeCarouselIndex.value + 1) % n
  }

  const LIST_DESC_MAX_LINES = 3

  function measureLocalDescPreview(el: HTMLElement): void {
    const full = props.pkg.description
    const style = getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return

    const maxHeight = lineHeight * LIST_DESC_MAX_LINES
    const probe = document.createElement('p')
    probe.className = el.className
    probe.style.cssText = [
      'position:absolute',
      'visibility:hidden',
      'pointer-events:none',
      'overflow:hidden',
      'max-height:' + maxHeight + 'px',
      'width:' + el.clientWidth + 'px',
      'line-height:' + style.lineHeight,
      'font-family:' + style.fontFamily,
      'font-size:' + style.fontSize,
      'font-weight:' + style.fontWeight,
      'letter-spacing:' + style.letterSpacing,
      'word-break:' + style.wordBreak,
      'overflow-wrap:' + style.overflowWrap,
    ].join(';')
    document.body.appendChild(probe)

    probe.textContent = full
    if (probe.scrollHeight <= maxHeight + 1) {
      descExpandable.value = false
      descPreviewBase.value = ''
      probe.remove()
      return
    }

    descExpandable.value = true
    let lo = 0
    let hi = full.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      probe.textContent = full.slice(0, mid) + ' …'
      if (probe.scrollHeight > maxHeight + 1) hi = mid - 1
      else lo = mid
    }

    let cut = lo
    const lastSpace = full.lastIndexOf(' ', cut)
    if (lastSpace > 0 && cut - lastSpace <= 14) cut = lastSpace

    descPreviewBase.value = full.slice(0, cut).trimEnd()
    probe.remove()
  }

  function measureDescClampable(): void {
    void nextTick(() => {
      requestAnimationFrame(() => {
        const el = descRef.value
        if (!el) return
        if (descriptionExpanded.value) return

        if (expandScope === 'local') {
          measureLocalDescPreview(el)
          return
        }

        descExpandable.value = el.scrollHeight > el.clientHeight + 1
      })
    })
  }

  function onLayoutResize(): void {
    measureDescClampable()
    if (measureTags) measureVisibleTags()
  }

  function setupCardResizeObserver(): void {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    void nextTick(() => {
      const el = cardRoot.value
      if (!el) return
      cardResizeObs = new ResizeObserver(() => onLayoutResize())
      cardResizeObs.observe(el)
    })
  }

  onMounted(() => {
    void nextTick(() => {
      measureDescClampable()
      if (measureTags) measureVisibleTags()
      setupCardResizeObserver()
    })
    window.addEventListener('resize', onLayoutResize)
  })

  onUnmounted(() => {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    window.removeEventListener('resize', onLayoutResize)
  })

  watch(() => [props.pkg.id, categoryGroups.value.length] as const, () => {
    scopeCarouselIndex.value = 0
    descExpandable.value = false
    descPreviewBase.value = ''
    if (expandScope === 'local') localDescriptionExpanded.value = false
    tagsExpanded.value = false
    tagsOverflow.value = false
    visibleTagCount.value = 0
    void nextTick(() => {
      measureDescClampable()
      if (measureTags) measureVisibleTags()
      setupCardResizeObserver()
    })
  })

  watch(() => props.pkg.description, () => {
    descExpandable.value = false
    descPreviewBase.value = ''
    void nextTick(measureDescClampable)
  })

  watch(descriptionExpanded, () => {
    if (!descriptionExpanded.value) void nextTick(measureDescClampable)
  })

  if (measureTags) {
    watch(
      () => tagLabels.value.join('\0'),
      () => {
        void nextTick(measureVisibleTags)
      },
    )

    watch(tagsExpanded, () => {
      void nextTick(measureVisibleTags)
    })

    watch(tagsOverflowBtnRef, () => {
      if (!tagsExpanded.value && tagsOverflowBtnRef.value) {
        measureVisibleTags()
      }
    })
  }

  const tagsExpandAriaLabel = computed(() =>
    tagsExpanded.value
      ? `Show less — collapse tags for ${props.pkg.name}`
      : `Show ${hiddenTagCount.value} more tag${hiddenTagCount.value !== 1 ? 's' : ''} for ${props.pkg.name}`,
  )

  const showTagsToggle = computed(
    () => measureTags && (tagsExpanded.value || tagsOverflow.value),
  )

  const descriptionExpandAriaLabel = computed(() =>
    descriptionExpanded.value
      ? expandScope === 'local'
        ? `Collapse description for ${props.pkg.name}`
        : 'Show less — collapse descriptions on all packages'
      : expandScope === 'local'
        ? `Expand description for ${props.pkg.name}`
        : 'Show more — expand descriptions on all packages',
  )

  return {
    descriptionExpanded,
    toggleDescriptionExpanded,
    descriptionExpandAriaLabel,
    descriptionExpandScope: expandScope,
    scopeCarouselIndex,
    cardRoot,
    descRef,
    descExpandable,
    descPreviewBase,
    copied,
    categoryGroups,
    scopeCarouselLen,
    scopeCarouselTrackStyle,
    descBodyId,
    tagLabels,
    tagsPanelRef,
    tagsMeasureRailRef,
    tagsOverflowBtnRef,
    displayedTagLabels,
    hiddenTagCount,
    tagsExpanded,
    tagsOverflow,
    toggleTagsExpanded,
    tagsExpandAriaLabel,
    showTagsToggle,
    ucTotal,
    useCasesNavigable,
    useCasesBrowseTitle,
    useCasesLinkBind,
    metaRows,
    fitDisplay,
    fitBreakdownRows,
    fitScoreAriaLabel,
    fitScorePillStyle,
    isTierRedundant,
    scopeChipTitle,
    scopeCarouselPrev,
    scopeCarouselNext,
    measureDescClampable,
    copyInstall,
  }
}
