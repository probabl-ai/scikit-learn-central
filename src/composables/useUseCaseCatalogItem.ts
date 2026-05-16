import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransientFeedback } from '@/composables/useTransientFeedback'
import { usePackageLookup } from '@/composables/usePackageLookup'
import { useUseCaseDescriptionExpand } from '@/composables/useUseCaseDescriptionExpand'
import { useUseCasePackagesExpand } from '@/composables/useUseCasePackagesExpand'
import type { PackageChipMeta } from '@/composables/usePackageLookup'
import type { UseCase } from '@/types/usecase'
import {
  filterKnownApplicationFields,
  filterKnownDataTypes,
  filterKnownProblemTypes,
  formatKnownList,
} from '@/types/usecase-taxonomy'
import { sortPackageChipsByCategory } from '@/utils/packageCategory'

export interface ClassificationRow {
  key: string
  icon: string
  label: string
  value: string
  sr: string
}

export interface UseCaseCatalogItemProps {
  useCase: UseCase
  /** Deep-linked card: permanent orange border + full synopsis. */
  focused?: boolean
}

export interface UseCaseCatalogItemOptions {
  /** `global`: card grid — one toggle expands all cards. `local`: list row — per row only. */
  descriptionExpandScope?: 'global' | 'local'
  /** `measured`: card overflow rail. `wrap`: list row shows all chips wrapped. */
  packagesDisplay?: 'measured' | 'wrap'
}

export function useUseCaseCatalogItem(
  props: UseCaseCatalogItemProps,
  options: UseCaseCatalogItemOptions = {},
) {
  const expandScope = options.descriptionExpandScope ?? 'global'
  const packagesDisplay = options.packagesDisplay ?? 'measured'
  const measurePackages = packagesDisplay === 'measured'

  const router = useRouter()
  const { show: showFeedback } = useTransientFeedback()
  const { useCaseDescriptionsExpanded, toggleUseCaseDescriptionsExpanded } =
    useUseCaseDescriptionExpand()
  const { useCasePackagesExpanded, toggleUseCasePackagesExpanded } =
    useUseCasePackagesExpand()
  const { resolvePackageChip } = usePackageLookup()

  const localDescriptionExpanded = ref(false)

  const cardRoot = ref<HTMLElement | null>(null)
  const descRef = ref<HTMLElement | null>(null)
  const descExpandable = ref(false)
  const descPreviewBase = ref('')
  const packagesPanelRef = ref<HTMLElement | null>(null)
  const packagesMeasureRailRef = ref<HTMLElement | null>(null)
  const packagesOverflowBtnRef = ref<HTMLElement | null>(null)
  const visiblePackageCount = ref(0)
  const packagesOverflow = ref(false)

  const copied = ref(false)
  let copiedTimer: ReturnType<typeof setTimeout> | undefined

  const descriptionExpanded = computed(() => {
    if (props.focused === true) return true
    if (expandScope === 'local') return localDescriptionExpanded.value
    return useCaseDescriptionsExpanded.value
  })

  function toggleDescriptionExpanded(): void {
    if (props.focused) return
    if (expandScope === 'local') {
      localDescriptionExpanded.value = !localDescriptionExpanded.value
    } else {
      toggleUseCaseDescriptionsExpanded()
    }
  }

  const descBodyId = computed(() => `uc-desc-${props.useCase.slug}`)

  const copyLinkLabel = computed(() =>
    copied.value ? 'Link copied' : 'Copy link to this use case',
  )

  const githubUrl = computed(
    () =>
      `https://github.com/probabl-ai/scikit-learn-central/blob/main/data/use-cases/${props.useCase.uuid}.py`,
  )

  const jupyterliteUrl = computed(
    () => `jupyterlite/lab/index.html?path=use-cases/${props.useCase.uuid}.ipynb`,
  )

  const classificationRows = computed((): ClassificationRow[] => [
    {
      key: 'application-field',
      icon: 'fa-building',
      label: 'Application Field',
      value: formatKnownList(
        props.useCase.application_fields ?? [],
        filterKnownApplicationFields,
      ),
      sr: 'Application fields',
    },
    {
      key: 'problem-type',
      icon: 'fa-bullseye',
      label: 'Problem Type',
      value: formatKnownList(props.useCase.problem_types ?? [], filterKnownProblemTypes),
      sr: 'Problem types',
    },
    {
      key: 'data-type',
      icon: 'fa-database',
      label: 'Data Type',
      value: formatKnownList(props.useCase.data_types ?? [], filterKnownDataTypes),
      sr: 'Data types',
    },
  ])

  const packageChips = computed(() =>
    (props.useCase.packages ?? []).map((id) => resolvePackageChip(id)),
  )

  const sortedPackageChips = computed(() => sortPackageChipsByCategory(packageChips.value))

  const packagesExpanded = computed(() => useCasePackagesExpanded.value)

  const displayedPackageChips = computed((): PackageChipMeta[] => {
    if (!measurePackages) return sortedPackageChips.value
    if (packagesExpanded.value) return sortedPackageChips.value
    if (!packagesOverflow.value) return sortedPackageChips.value
    return sortedPackageChips.value.slice(0, visiblePackageCount.value)
  })

  const hiddenPackageCount = computed(() =>
    Math.max(0, packageChips.value.length - displayedPackageChips.value.length),
  )

  function togglePackagesExpanded(): void {
    toggleUseCasePackagesExpanded()
  }

  function measureVisiblePackages(): void {
    if (!measurePackages) return
    void nextTick(() => {
      requestAnimationFrame(() => {
        const total = sortedPackageChips.value.length
        if (total === 0) {
          packagesOverflow.value = false
          visiblePackageCount.value = 0
          return
        }

        if (packagesExpanded.value) {
          visiblePackageCount.value = total
          return
        }

        const panel = packagesPanelRef.value
        const rail = packagesMeasureRailRef.value
        if (!panel || !rail) return

        const chips = rail.querySelectorAll<HTMLElement>('[data-package-measure]')
        if (!chips.length) return

        const available = panel.clientWidth
        if (available <= 0) return

        const gap = Number.parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 4
        const moreBtnWidth =
          (packagesOverflowBtnRef.value?.offsetWidth ?? 0) ||
          Math.max(36, 22 + String(total).length * 7)

        let used = 0
        let count = 0

        for (let i = 0; i < chips.length; i++) {
          const chipW = chips[i].offsetWidth
          const gapBefore = count > 0 ? gap : 0
          const needsMore = i < chips.length - 1
          const reserve = needsMore ? gap + moreBtnWidth : 0
          if (used + gapBefore + chipW + reserve > available + 0.5) break
          used += gapBefore + chipW
          count++
        }

        if (count < chips.length) {
          packagesOverflow.value = true
          visiblePackageCount.value = count
          return
        }

        packagesOverflow.value = false
        visiblePackageCount.value = total
      })
    })
  }

  async function copyLink(): Promise<void> {
    const { href } = router.resolve({
      name: 'use-cases',
      query: { slug: props.useCase.slug },
    })
    const url = `${window.location.origin}${window.location.pathname}${href}`
    try {
      await navigator.clipboard.writeText(url)
      copied.value = true
      if (copiedTimer !== undefined) clearTimeout(copiedTimer)
      copiedTimer = setTimeout(() => {
        copied.value = false
        copiedTimer = undefined
      }, 1200)
      showFeedback('Link copied')
    } catch {
      // silent
    }
  }

  const LIST_DESC_MAX_LINES = 3

  function measureLocalDescPreview(el: HTMLElement): void {
    const full = props.useCase.synopsis
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

  let cardResizeObs: ResizeObserver | null = null

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

  function setupCardResizeObserver(): void {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    void nextTick(() => {
      const el = cardRoot.value
      if (!el) return
      cardResizeObs = new ResizeObserver(() => {
        measureDescClampable()
        if (measurePackages) measureVisiblePackages()
      })
      cardResizeObs.observe(el)
    })
  }

  function onLayoutResize(): void {
    measureDescClampable()
    if (measurePackages) measureVisiblePackages()
  }

  onMounted(() => {
    void nextTick(() => {
      measureDescClampable()
      if (measurePackages) measureVisiblePackages()
      setupCardResizeObserver()
    })
    window.addEventListener('resize', onLayoutResize)
  })

  onUnmounted(() => {
    cardResizeObs?.disconnect()
    cardResizeObs = null
    window.removeEventListener('resize', onLayoutResize)
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
  })

  watch(
    () => props.useCase.slug,
    () => {
      descExpandable.value = false
      descPreviewBase.value = ''
      if (expandScope === 'local') localDescriptionExpanded.value = false
      packagesOverflow.value = false
      visiblePackageCount.value = 0
      void nextTick(() => {
        measureDescClampable()
        if (measurePackages) measureVisiblePackages()
        setupCardResizeObserver()
      })
    },
  )

  if (measurePackages) {
    watch(
      () => packageChips.value.map((c) => c.id).join(','),
      () => {
        void nextTick(measureVisiblePackages)
      },
    )

    watch(packagesExpanded, () => {
      void nextTick(measureVisiblePackages)
    })

    watch(packagesOverflowBtnRef, () => {
      if (!packagesExpanded.value && packagesOverflowBtnRef.value) {
        measureVisiblePackages()
      }
    })
  }

  watch(() => props.useCase.synopsis, () => {
    descExpandable.value = false
    descPreviewBase.value = ''
    void nextTick(measureDescClampable)
  })

  watch(descriptionExpanded, () => {
    if (!descriptionExpanded.value) void nextTick(measureDescClampable)
  })

  watch(
    () => props.focused,
    () => {
      if (!descriptionExpanded.value) void nextTick(measureDescClampable)
    },
  )

  const descriptionExpandAriaLabel = computed(() =>
    descriptionExpanded.value
      ? props.focused
        ? `Synopsis for ${props.useCase.title}`
        : expandScope === 'local'
          ? `Collapse synopsis for ${props.useCase.title}`
          : 'Show less — collapse descriptions on all use cases'
      : expandScope === 'local'
        ? `Expand synopsis for ${props.useCase.title}`
        : 'Show more — expand descriptions on all use cases',
  )

  const showSynopsisToggle = computed(
    () => !props.focused && expandScope === 'global' && (descriptionExpanded.value || descExpandable.value),
  )

  const packagesExpandAriaLabel = computed(() =>
    packagesExpanded.value
      ? 'Show less — collapse packages on all use cases'
      : `Show ${hiddenPackageCount.value} more package${hiddenPackageCount.value !== 1 ? 's' : ''} on all use cases`,
  )

  const showPackagesToggle = computed(
    () => measurePackages && (packagesExpanded.value || packagesOverflow.value),
  )

  return {
    cardRoot,
    descRef,
    descExpandable,
    descPreviewBase,
    descBodyId,
    descriptionExpanded,
    toggleDescriptionExpanded,
    descriptionExpandAriaLabel,
    showSynopsisToggle,
    githubUrl,
    jupyterliteUrl,
    copyLink,
    copied,
    copyLinkLabel,
    classificationRows,
    sortedPackageChips,
    packagesPanelRef,
    packagesMeasureRailRef,
    packagesOverflowBtnRef,
    displayedPackageChips,
    hiddenPackageCount,
    packagesExpanded,
    togglePackagesExpanded,
    packagesExpandAriaLabel,
    showPackagesToggle,
  }
}
