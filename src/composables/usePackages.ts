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

/* ─────────────────────────── Fit-Score weights ───────────────────────────
 *
 * Weights are taken from Nadi & Sakr (EMSE 2022), "Selecting Third-party
 * Libraries: The Data Scientist's Perspective". The paper surveyed 90 data
 * scientists and ranked 26 library-selection factors by "% of respondents
 * who rated this factor moderate or high influence":
 *
 *   - Documentation          87 %   (rank 2)
 *   - Fit for purpose        86 %   (rank 3 — biggest gap vs developers)
 *   - Community activeness   84 %   (rank 4)
 *   - Community experience   76 %   (rank 7)
 *   - Popularity             67 %   (rank 11)
 *   - Well tested            87 %   (rank 17 by total mod+high)
 *
 * Weights are normalised so they sum to 1.0. */
const W_FITNESS   = 86 / 487 // 0.177
const W_ACTIVITY  = 84 / 487 // 0.172
const W_COMMUNITY = 76 / 487 // 0.156
const W_ADOPTION  = 67 / 487 // 0.138
const W_DOCS      = 87 / 487 // 0.179
const W_TESTING   = 87 / 487 // 0.179

/** Half-life in days for the activity decay. With H = 180, a package fully
 *  goes stale in ~2 years: 180 days → 50, 365 days → 25, 540 days → 13. */
const ACTIVITY_HALF_LIFE_DAYS = 180
const DAY_MS = 86_400_000

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, (Date.now() - t) / DAY_MS)
}

/** Exponential freshness: 100 at age 0, drops by half every `halfLife` days.
 *  Returns 0 if input is null. */
function freshness(days: number | null, halfLife = ACTIVITY_HALF_LIFE_DAYS): number {
  if (days == null) return 0
  return 100 * Math.pow(0.5, days / halfLife)
}

function logNormalise(value: number, max: number): number {
  return (Math.log(value + 1) / Math.log(max + 1)) * 100
}

/** Documentation: count of the three sections present out of three.
 *  Unknown (missing field) → 0 (rewards packages we've reviewed). */
function docsScore(p: PackageRaw): number {
  const d = p.docs_quality
  if (!d) return 0
  const n = (d.getting_started ? 1 : 0) + (d.api_reference ? 1 : 0) + (d.narrative_guide ? 1 : 0)
  return (n / 3) * 100
}

/** Testing: prefer auto-fetched coverage (codecov, then coveralls — both
 *  refreshed daily by update_stats.py), then fall back to a manually curated
 *  coverage % in the package JSON, then to 50 if a tests/ dir exists,
 *  otherwise 0. */
function testingScore(p: PackageRaw, stats?: PackageStats): number {
  const fromCodecov = stats?.codecov?.coverage
  if (typeof fromCodecov === 'number') return Math.max(0, Math.min(100, fromCodecov))
  const fromCoveralls = stats?.coveralls?.coverage
  if (typeof fromCoveralls === 'number') return Math.max(0, Math.min(100, fromCoveralls))
  const t = p.testing
  if (!t) return 0
  if (typeof t.test_coverage === 'number') return Math.max(0, Math.min(100, t.test_coverage))
  return t.has_tests ? 50 : 0
}

/**
 * Build enriched packages: merge stats, then compute fit scores against the
 * full ecosystem. Probabl-core packages receive a +100 boost to fitTotal
 * only — fitBase (the value shown in the UI) is never modified.
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

  /* Per-package raw metrics — collected up-front so we can take maxima
     across the ecosystem before normalising. */
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

    /* Fit for purpose: linear normalisation by use-case count. Zero use-case
       packages get 0 — and the paper's whole point is that DS care about
       whether a library *fits* their task, so this is the right shape. */
    p.fitFitness = (r.uc / maxUc) * 100

    /* Activity: average freshness of (last commit, last release). If a
       package only has one of the two timestamps, use that one alone. */
    const commitFresh = freshness(r.commitDays)
    const releaseFresh = freshness(r.releaseDays)
    const present = [commitFresh, releaseFresh].filter(
      (_, j) => (j === 0 ? r.commitDays : r.releaseDays) != null,
    )
    p.fitActivity = present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0

    /* Community: average of log-normalised stars and log-normalised forks.
       Stars proxy general repo visibility, forks proxy contributor base —
       both feed the paper's "community experience" factor. */
    p.fitCommunity =
      (logNormalise(r.stars, maxStars) + logNormalise(r.forks, maxForks)) / 2

    /* Adoption: log-normalised monthly downloads (popularity / post-install). */
    p.fitAdoption = logNormalise(r.downloads, maxDownloads)

    /* Documentation and Testing: editorially curated per-package (see
       data/packages/*.json). Missing data → 0 so unreviewed packages
       surface as needing attention. */
    p.fitDocs = docsScore(p)
    p.fitTesting = testingScore(p, p.stats)

    p.fitBase =
      W_FITNESS * p.fitFitness +
      W_ACTIVITY * p.fitActivity +
      W_COMMUNITY * p.fitCommunity +
      W_ADOPTION * p.fitAdoption +
      W_DOCS * p.fitDocs +
      W_TESTING * p.fitTesting

    /* Editorial boost (+100 to fitTotal only): pins Probabl-maintained core
       packages above the general ecosystem in the default ranking. Disclosed
       in the card tooltip. fitBase is unchanged and is the only number
       displayed numerically. */
    p.fitTotal = p.fitBase + (p.probabl && p.scope === 'core' ? 100 : 0)
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

/* Re-exported so views can show the same weights/half-life used in the
   computation — keeps the About-page methodology section in sync. */
export const FIT_WEIGHTS = {
  fitness: W_FITNESS,
  activity: W_ACTIVITY,
  community: W_COMMUNITY,
  adoption: W_ADOPTION,
  docs: W_DOCS,
  testing: W_TESTING,
} as const
export const FIT_ACTIVITY_HALF_LIFE_DAYS = ACTIVITY_HALF_LIFE_DAYS
