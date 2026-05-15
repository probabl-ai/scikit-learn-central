/* New scope taxonomy (see issue #16). A package belongs to one or more
 * categories; each category has a tier indicating where in a DS workflow
 * it sits:
 *
 *   T1 — Pipeline construction  (Components / Domain Toolkit / Assembly Utility)
 *   T2 — Pipeline steering      (Evaluation / Explainability / Fairness / HPO·AutoML)
 *   T3 — Infrastructure         (Infrastructure)
 *
 * The old `nature` and `scope` fields have been removed entirely; the
 * categories vocabulary replaces both.
 */
export type Category =
  | 'components'
  | 'domain-toolkit'
  | 'assembly-utility'
  | 'evaluation'
  | 'explainability'
  | 'fairness'
  | 'hpo-automl'
  | 'mlops'
  | 'hpc'

export type Tier = 1 | 2 | 3

export interface CategoryMeta {
  tier: Tier
  label: string
  /** Short human description shown in the filter dropdown header. */
  tierLabel: string
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  components: {
    tier: 1,
    label: 'Components',
    tierLabel: 'Pipeline construction',
  },
  'domain-toolkit': {
    tier: 1,
    label: 'Domain Toolkit',
    tierLabel: 'Pipeline construction',
  },
  'assembly-utility': {
    tier: 1,
    label: 'Assembly Utility',
    tierLabel: 'Pipeline construction',
  },
  evaluation: {
    tier: 2,
    label: 'Evaluation',
    tierLabel: 'Pipeline steering',
  },
  explainability: {
    tier: 2,
    label: 'Explainability',
    tierLabel: 'Pipeline steering',
  },
  fairness: {
    tier: 2,
    label: 'Fairness',
    tierLabel: 'Pipeline steering',
  },
  'hpo-automl': {
    tier: 2,
    label: 'HPO / AutoML',
    tierLabel: 'Pipeline steering',
  },
  mlops: {
    tier: 3,
    label: 'MLOps',
    tierLabel: 'Infrastructure',
  },
  hpc: {
    tier: 3,
    label: 'High Performance Computing',
    tierLabel: 'Infrastructure',
  },
}

export const CATEGORIES: ReadonlyArray<Category> = Object.keys(
  CATEGORY_META,
) as Category[]

export type License =
  | 'MIT'
  | 'BSD-3-Clause'
  | 'BSD-2-Clause'
  | 'Apache-2.0'
  | 'GPL-3.0'
  | string

export interface PackageRaw {
  id: string
  name: string
  pypi_name?: string
  website?: string
  repository?: string
  docs?: string
  /** One or more categories from the taxonomy above. Multi-category
   *  packages (e.g. `imbalanced-learn` is both Components and Assembly
   *  Utility) carry every applicable entry. */
  categories: Category[]
  license: License
  archived?: boolean
  description: string
  tags: string[]
}

export interface CorePackage extends Omit<PackageRaw, 'categories'> {
  is_core: true
  contributors_count: number
  stars?: number
  downloads?: number
  stats?: PackageStats
}

/** Package enriched with stats + computed fit scores. */
export interface Package extends PackageRaw {
  stars?: number
  downloads?: number
  version?: string
  stats?: PackageStats
  fitStars: number
  fitDownloads: number
  fitUseCases: number
  fitBase: number
  fitTotal: number
}

export interface PackageStats {
  github?: {
    stars?: number
    forks?: number
    watchers?: number
    open_issues?: number
    last_commit?: string
    latest_release?: string
  }
  pypi?: {
    version?: string
    release_date?: string
    downloads?: {
      last_day?: number
      last_week?: number
      last_month?: number
    }
  }
}
