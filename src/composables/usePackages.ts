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

/* Weights from Nadi & Sakr (EMSE 2022, 90-participant survey of data
 * scientists). Each weight is the % of respondents who rated that factor as
 * moderate-or-high influence on library choice. We normalise so they sum to 1. */
const W_FITNESS = 86 / 487
const W_ACTIVITY = 84 / 487
const W_COMMUNITY = 76 / 487
const W_ADOPTION = 67 / 487
const W_DOCS = 87 / 487
const W_TESTING = 87 / 487

const DAY_MS = 24 * 60 * 60 * 1000

/** Half-life (days) used for the exponential-decay activity score:
 *  1-week-old commit ≈ 97, 6-month-old ≈ 50, 2-year-old ≈ 13. */
const ACTIVITY_HALF_LIFE_DAYS = 180

/** Probabl-core stewardship boost added on top of fitBase. Large on purpose:
 *  Probabl-maintained core libraries should surface at the top of the catalog. */
const PROBABL_BOOST = 100

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, (Date.now() - t) / DAY_MS)
}

function freshness(days: number | null, halfLife = ACTIVITY_HALF_LIFE_DAYS): number {
  if (days == null) return 0
  return 100 * Math.pow(0.5, days / halfLife)
}

function logNormalise(value: number, max: number): number {
  if (max <= 0) return 0
  return (Math.log(value + 1) / Math.log(max + 1)) * 100
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function docsScore(p: PackageRaw): number {
  const d = p.docs_quality
  if (!d) return 0
  const n =
    (d.getting_started ? 1 : 0) +
    (d.api_reference ? 1 : 0) +
    (d.narrative_guide ? 1 : 0)
  return (n / 3) * 100
}

function testingScore(p: PackageRaw, s?: PackageStats): number {
  const fromCodecov = s?.codecov?.coverage
  if (typeof fromCodecov === 'number') return clampPct(fromCodecov)
  const fromCoveralls = s?.coveralls?.coverage
  if (typeof fromCoveralls === 'number') return clampPct(fromCoveralls)
  const t = p.testing
  if (!t) return 0
  if (typeof t.test_coverage === 'number') return clampPct(t.test_coverage)
  return t.has_tests ? 50 : 0
}

/**
 * Build enriched packages: merge stats, then compute the Fit Score against
 * the full ecosystem. See AboutView's Ranking Methodology section for the
 * formula and a breakdown of every weight.
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
      fitFitness: 0,
      fitActivity: 0,
      fitCommunity: 0,
      fitAdoption: 0,
      fitDocs: 0,
      fitTesting: 0,
      fitBase: 0,
      fitTotal: 0,
    }
  })

  const ucCount = (id: string): number =>
    useCases.value.filter((uc) => uc.packages.includes(id)).length

  const raws = withStats.map((p) => ({
    stars: p.stats?.github?.stars ?? 0,
    forks: p.stats?.github?.forks ?? 0,
    downloads: p.downloads ?? 0,
    uc: ucCount(p.id),
    commitDays: daysSince(p.stats?.github?.last_commit),
    releaseDays: daysSince(
      p.stats?.github?.latest_release_date ?? p.stats?.pypi?.release_date,
    ),
  }))

  const maxStars = Math.max(...raws.map((r) => r.stars), 1)
  const maxForks = Math.max(...raws.map((r) => r.forks), 1)
  const maxDownloads = Math.max(...raws.map((r) => r.downloads), 1)
  const maxUc = Math.max(...raws.map((r) => r.uc), 1)

  withStats.forEach((p, i) => {
    const r = raws[i]

    p.fitFitness = (r.uc / maxUc) * 100

    const commitFresh = r.commitDays != null ? freshness(r.commitDays) : null
    const releaseFresh = r.releaseDays != null ? freshness(r.releaseDays) : null
    const present = [commitFresh, releaseFresh].filter(
      (v): v is number => v != null,
    )
    p.fitActivity = present.length
      ? present.reduce((a, b) => a + b, 0) / present.length
      : 0

    p.fitCommunity =
      (logNormalise(r.stars, maxStars) + logNormalise(r.forks, maxForks)) / 2
    p.fitAdoption = logNormalise(r.downloads, maxDownloads)

    p.fitDocs = docsScore(p)
    p.fitTesting = testingScore(p, p.stats)

    p.fitBase =
      W_FITNESS * p.fitFitness +
      W_ACTIVITY * p.fitActivity +
      W_COMMUNITY * p.fitCommunity +
      W_ADOPTION * p.fitAdoption +
      W_DOCS * p.fitDocs +
      W_TESTING * p.fitTesting

    p.fitTotal = p.fitBase + (p.probabl ? PROBABL_BOOST : 0)
  })

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
let cachedFeaturedPackages: ComputedRef<Package[]> | null = null

const featuredPackageIds: readonly string[] = catalog.featured_packages

export interface UsePackages {
  core: Ref<CorePackage>
  packages: Ref<Package[]>
  meta: ComputedRef<CatalogRaw['meta']>
  featuredPackageIds: readonly string[]
  featuredPackages: ComputedRef<Package[]>
}

export const FIT_WEIGHTS = {
  fitness: W_FITNESS,
  activity: W_ACTIVITY,
  community: W_COMMUNITY,
  adoption: W_ADOPTION,
  docs: W_DOCS,
  testing: W_TESTING,
} as const

export const FIT_ACTIVITY_HALF_LIFE_DAYS = ACTIVITY_HALF_LIFE_DAYS
export const FIT_PROBABL_BOOST = PROBABL_BOOST

export function usePackages(): UsePackages {
  if (!cachedPackages) {
    const { useCases } = useUseCases()
    cachedPackages = ref(buildPackages(useCases))
    cachedCore = ref(buildCore())
    cachedFeaturedPackages = computed(() => {
      const byId = new Map(cachedPackages!.value.map((p) => [p.id, p]))
      return catalog.featured_packages
        .map((id) => byId.get(id))
        .filter((p): p is Package => p != null)
    })
  }
  return {
    core: cachedCore!,
    packages: cachedPackages,
    meta: computed(() => catalog.meta),
    featuredPackageIds,
    featuredPackages: cachedFeaturedPackages!,
  }
}
