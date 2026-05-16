import type { Category, Tier } from '@/types/package'
import { CATEGORIES, CATEGORY_META } from '@/types/package'

export interface PackageChipGroupable {
  id: string
  label: string
  categories: Category[]
}

export interface PackageChipGroup<T extends PackageChipGroupable = PackageChipGroupable> {
  key: string
  label: string
  tier: Tier
  chips: T[]
}

function categorySortIndex(categories: Category[]): number {
  const primary = getPrimaryCategory(categories)
  if (!primary) return CATEGORIES.length
  return CATEGORIES.indexOf(primary)
}

/** First category by workflow tier, then catalog order (matches PackageCard scope carousel). */
export function getPrimaryCategory(categories: Category[] | undefined): Category | null {
  if (!categories?.length) return null

  const seen = new Set<Category>()
  const rows: Array<{ category: Category; tier: Tier; sourceIndex: number }> = []
  let sourceIndex = 0

  for (const c of categories) {
    if (seen.has(c)) continue
    seen.add(c)
    rows.push({ category: c, tier: CATEGORY_META[c].tier, sourceIndex: sourceIndex++ })
  }

  rows.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.sourceIndex - b.sourceIndex))
  return rows[0]?.category ?? null
}

/** Lowest workflow tier among a package's categories (same ordering as PackageCard scope carousel). */
export function getPrimaryCategoryTier(categories: Category[] | undefined): Tier {
  if (!categories?.length) return 1

  const seen = new Set<Category>()
  const rows: Array<{ tier: Tier; sourceIndex: number }> = []
  let sourceIndex = 0

  for (const c of categories) {
    if (seen.has(c)) continue
    seen.add(c)
    rows.push({ tier: CATEGORY_META[c].tier, sourceIndex: sourceIndex++ })
  }

  rows.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.sourceIndex - b.sourceIndex))
  return rows[0]?.tier ?? 1
}

export function sortPackageChipsByCategory<T extends PackageChipGroupable>(chips: T[]): T[] {
  return [...chips].sort(
    (a, b) =>
      categorySortIndex(a.categories) - categorySortIndex(b.categories) ||
      a.label.localeCompare(b.label),
  )
}

/** Group package chips by primary subcategory in catalog order. */
export function groupPackageChipsByCategory<T extends PackageChipGroupable>(
  chips: T[],
): PackageChipGroup<T>[] {
  const sorted = sortPackageChipsByCategory(chips)
  const sections: PackageChipGroup<T>[] = []
  const uncategorized: T[] = []

  for (const c of CATEGORIES) {
    const meta = CATEGORY_META[c]
    const inGroup = sorted.filter((chip) => getPrimaryCategory(chip.categories) === c)
    if (inGroup.length) {
      sections.push({
        key: c,
        label: meta.label,
        tier: meta.tier,
        chips: inGroup,
      })
    }
  }

  for (const chip of sorted) {
    if (!getPrimaryCategory(chip.categories)) uncategorized.push(chip)
  }

  if (uncategorized.length) {
    sections.push({
      key: '__uncategorized__',
      label: 'Other',
      tier: 1,
      chips: uncategorized,
    })
  }

  return sections
}
