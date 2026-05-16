import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { Category, Tier } from '@/types/package'
import { usePackages } from '@/composables/usePackages'
import { getPrimaryCategoryTier } from '@/utils/packageCategory'

export interface PackageChipMeta {
  id: string
  label: string
  categories: Category[]
  tier: Tier
  navigable: boolean
  catalogTo: RouteLocationRaw
  browseTitle: string
}

export function usePackageLookup() {
  const { packages, core } = usePackages()

  const packagesById = computed(
    () => new Map(packages.value.map((p) => [p.id, p])),
  )

  function resolvePackageChip(id: string): PackageChipMeta {
    if (id === core.value.id) {
      const categories = core.value.categories ?? []
      const tier = getPrimaryCategoryTier(categories)
      return {
        id,
        label: id,
        categories,
        tier,
        navigable: true,
        catalogTo: { path: '/catalog', query: { package: id } },
        browseTitle: `View ${core.value.name} in the ecosystem catalog`,
      }
    }

    const pkg = packagesById.value.get(id)
    if (!pkg) {
      return {
        id,
        label: id,
        categories: [],
        tier: 1,
        navigable: false,
        catalogTo: { path: '/catalog' },
        browseTitle: `${id} is not listed in the ecosystem catalog`,
      }
    }

    const categories = pkg.categories ?? []
    return {
      id,
      label: id,
      categories,
      tier: getPrimaryCategoryTier(categories),
      navigable: true,
      catalogTo: { path: '/catalog', query: { package: id } },
      browseTitle: `View ${pkg.name} in the ecosystem catalog`,
    }
  }

  return { resolvePackageChip, packagesById }
}
