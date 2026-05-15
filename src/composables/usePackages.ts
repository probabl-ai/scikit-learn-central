import { computed, ref, type ComputedRef, type Ref } from 'vue'
import catalogJson from '@data/catalog.json'
import statsJson from '@data/stats.json'
import type { CatalogRaw } from '@/types/catalog'
import type { Package, PackageRaw, CorePackage, PackageStats } from '@/types/package'
import type { StatsFile } from '@/types/stats'
import { useUseCases } from './useUseCases'

const catalog = catalogJson as unknown as CatalogRaw
const stats = statsJson as unknown as StatsFile

const packageModules = import.meta.glob<{ default: PackageRaw }>(
  '@data/packages/*.json',
  { eager: true },
)

const packagesById = new Map<string, PackageRaw>()
for (const mod of Object.values(packageModules)) {
  const pkg = mod.default
  if (pkg && !pkg.archived) packagesById.set(pkg.id, pkg)
}

/**
 * Build enriched packages: merge stats, then compute fit scores against the
 * full ecosystem. Probabl-flagged packages receive a +100 boost to fitTotal only —
 * fitBase (the value shown in the UI) is never modified.
 */
function buildPackages(useCases: ReturnType<typeof useUseCases>['useCases']): Package[] {
  const ids = catalog.packages.filter((id) => packagesById.has(id))
  const raw = ids.map((id) => packagesById.get(id)!)

  const withStats = raw.map((p): Package => {
    const s: PackageStats | undefined = stats.packages?.[p.id]
    return {
      ...p,
      stars: s?.github?.stars,
      downloads: s?.pypi?.downloads?.last_month,
      version: s?.pypi?.version,
      stats: s,
      fitStars: 0,
      fitDownloads: 0,
      fitUseCases: 0,
      fitBase: 0,
      fitTotal: 0,
    }
  })

  const ucCount = (id: string) =>
    useCases.value.filter((uc) => uc.packages.includes(id)).length

  const maxStars = Math.max(...withStats.map((p) => p.stars ?? 0), 1)
  const maxDownloads = Math.max(...withStats.map((p) => p.downloads ?? 0), 1)
  const maxUc = Math.max(...withStats.map((p) => ucCount(p.id)), 1)

  for (const p of withStats) {
    p.fitStars = (Math.log((p.stars ?? 0) + 1) / Math.log(maxStars + 1)) * 100
    p.fitDownloads =
      (Math.log((p.downloads ?? 0) + 1) / Math.log(maxDownloads + 1)) * 100
    p.fitUseCases = (ucCount(p.id) / maxUc) * 100
    p.fitBase = (p.fitStars + p.fitDownloads + p.fitUseCases) / 3
    p.fitTotal = p.fitBase + (p.probabl ? 100 : 0)
  }

  return withStats
}

/** Enrich the core (scikit-learn) hero with live stats. */
function buildCore(): CorePackage {
  const c = { ...catalog.core }
  const s = stats.packages?.[c.id]
  if (s) c.stats = s
  if (s?.github?.stars != null) c.stars = s.github.stars
  if (s?.pypi?.downloads?.last_month != null)
    c.downloads = s.pypi.downloads.last_month
  return c
}

let cachedPackages: Ref<Package[]> | null = null
let cachedCore: Ref<CorePackage> | null = null

export interface UsePackages {
  core: Ref<CorePackage>
  packages: Ref<Package[]>
  meta: ComputedRef<CatalogRaw['meta']>
}

export function usePackages(): UsePackages {
  if (!cachedPackages) {
    const { useCases } = useUseCases()
    cachedPackages = ref(buildPackages(useCases))
    cachedCore = ref(buildCore())
  }
  return {
    core: cachedCore!,
    packages: cachedPackages,
    meta: computed(() => catalog.meta),
  }
}
