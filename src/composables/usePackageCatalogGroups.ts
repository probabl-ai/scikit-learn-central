import { computed, type ComputedRef, type Ref } from 'vue'
import type { Category, Package, Tier } from '@/types/package'
import { CATEGORIES, CATEGORY_META } from '@/types/package'

export type GroupByKey = 'none' | 'main' | 'sub'

export interface CatalogGroupSection {
  key: string
  /** Primary heading text (main-category mode). */
  label: string
  /** Main category (tier label), set in subcategory mode. */
  tierLabel?: string
  /** Subcategory label, set in subcategory mode. */
  subLabel?: string
  tier?: Tier
  packages: Package[]
}

function subcategorySectionLabel(tierLabel: string, subLabel: string): string {
  return `${tierLabel}: ${subLabel}`
}

const UNCATEGORIZED_KEY = '__uncategorized__'
const UNCATEGORIZED_LABEL = 'Uncategorized'

const MAIN_SECTION_ORDER: Array<{ tier: Tier; label: string }> = [
  { tier: 1, label: 'Pipeline construction' },
  { tier: 2, label: 'Pipeline steering' },
  { tier: 3, label: 'Infrastructure' },
]

interface BucketMeta {
  label: string
  tierLabel?: string
  subLabel?: string
  tier?: Tier
}

function bucketKeyForMain(tierLabel: string): string {
  return `main:${tierLabel}`
}

function bucketKeyForSub(category: Category): string {
  return `sub:${category}`
}

export function usePackageCatalogGroups(
  packages: Ref<Package[]> | ComputedRef<Package[]>,
  groupBy: Ref<GroupByKey> | ComputedRef<GroupByKey>,
) {
  const groupedSections = computed<CatalogGroupSection[]>(() => {
    const list = packages.value
    const mode = groupBy.value

    if (mode === 'none') {
      return [{ key: 'all', label: '', packages: list }]
    }

    const buckets = new Map<string, { meta: BucketMeta; packages: Package[] }>()

    function ensureBucket(key: string, meta: BucketMeta): void {
      if (!buckets.has(key)) {
        buckets.set(key, { meta, packages: [] })
      }
    }

    function addToBucket(key: string, meta: BucketMeta, pkg: Package): void {
      ensureBucket(key, meta)
      buckets.get(key)!.packages.push(pkg)
    }

    for (const pkg of list) {
      const cats = pkg.categories ?? []

      if (cats.length === 0) {
        addToBucket(UNCATEGORIZED_KEY, { label: UNCATEGORIZED_LABEL }, pkg)
        continue
      }

      if (mode === 'main') {
        const seenTiers = new Set<Tier>()
        for (const c of cats) {
          const meta = CATEGORY_META[c]
          if (seenTiers.has(meta.tier)) continue
          seenTiers.add(meta.tier)
          addToBucket(bucketKeyForMain(meta.tierLabel), {
            label: meta.tierLabel,
            tier: meta.tier,
          }, pkg)
        }
      } else {
        const seen = new Set<Category>()
        for (const c of cats) {
          if (seen.has(c)) continue
          seen.add(c)
          const meta = CATEGORY_META[c]
          addToBucket(bucketKeyForSub(c), {
            label: subcategorySectionLabel(meta.tierLabel, meta.label),
            tierLabel: meta.tierLabel,
            subLabel: meta.label,
            tier: meta.tier,
          }, pkg)
        }
      }
    }

    const sections: CatalogGroupSection[] = []

    if (mode === 'main') {
      for (const { tier, label } of MAIN_SECTION_ORDER) {
        const key = bucketKeyForMain(label)
        const bucket = buckets.get(key)
        if (bucket && bucket.packages.length > 0) {
          sections.push({
            key,
            label: bucket.meta.label,
            tier,
            packages: bucket.packages,
          })
        }
      }
    } else {
      for (const c of CATEGORIES) {
        const key = bucketKeyForSub(c)
        const bucket = buckets.get(key)
        if (bucket && bucket.packages.length > 0) {
          const meta = CATEGORY_META[c]
          sections.push({
            key,
            label: subcategorySectionLabel(meta.tierLabel, meta.label),
            tierLabel: meta.tierLabel,
            subLabel: meta.label,
            tier: meta.tier,
            packages: bucket.packages,
          })
        }
      }
    }

    const uncategorized = buckets.get(UNCATEGORIZED_KEY)
    if (uncategorized && uncategorized.packages.length > 0) {
      sections.push({
        key: UNCATEGORIZED_KEY,
        label: UNCATEGORIZED_LABEL,
        packages: uncategorized.packages,
      })
    }

    return sections
  })

  return { groupedSections }
}
