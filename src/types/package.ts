export type Nature = 'library' | 'extension' | 'application'
export type Scope = 'core' | 'incremental' | 'verticalized'
export type License =
  | 'MIT'
  | 'BSD-3-Clause'
  | 'BSD-2-Clause'
  | 'Apache-2.0'
  | 'GPL-3.0'
  | string

export interface DocsQuality {
  /** Has an install / quickstart / first-steps page. */
  getting_started: boolean
  /** Has an API reference (autodoc / classes / methods). */
  api_reference: boolean
  /** Has a user guide / tutorial walkthrough beyond the API reference. */
  narrative_guide: boolean
}

export interface TestingInfo {
  /** A tests/ or test/ directory exists at the repo root. */
  has_tests: boolean
  /** Coverage % (0–100). null if not publicly available. */
  test_coverage: number | null
}

export interface PackageRaw {
  id: string
  name: string
  pypi_name?: string
  website?: string
  repository?: string
  /** Override for the codecov slug ("owner/repo") when it differs from the
   *  GitHub repo path (e.g. feature-engine ships on codecov as
   *  feature-engine/feature_engine instead of feature-engine/feature-engine). */
  codecov_slug?: string
  /** Override for the coveralls slug ("owner/repo") when different from GitHub. */
  coveralls_slug?: string
  docs?: string
  nature: Nature
  scope: Scope
  license: License
  probabl?: boolean
  archived?: boolean
  provides_estimators: boolean
  consumes_estimators: boolean
  description: string
  tags: string[]
  /** Editorially curated documentation completeness. Optional during rollout. */
  docs_quality?: DocsQuality
  /** Testing + coverage info. Optional during rollout. */
  testing?: TestingInfo
}

export interface CorePackage extends Omit<PackageRaw, 'nature' | 'scope'> {
  is_core: true
  contributors_count: number
  stars?: number
  downloads?: number
  stats?: PackageStats
}

/** Package enriched with stats + computed fit scores.
 *
 * Sub-scores (all 0–100) follow the deterministic signals derivable from
 * stats.json + use-cases.json. Weights come from the Nadi & Sakr (EMSE 2022)
 * survey of data scientists, where each factor's weight is its "% of
 * respondents who rated it moderate or high influence". See usePackages.ts
 * for the formula. */
export interface Package extends PackageRaw {
  stars?: number
  downloads?: number
  version?: string
  stats?: PackageStats
  /** Fit for purpose — curated use-case count, linear-normalised. (paper rank 3, 86%) */
  fitFitness: number
  /** Community activeness — recency of last commit + last release. (rank 4, 84%) */
  fitActivity: number
  /** Community experience — log-normalised mean of stars + forks. (rank 7, 76%) */
  fitCommunity: number
  /** Adoption / popularity — log-normalised monthly downloads. (rank 11, 67%) */
  fitAdoption: number
  /** Documentation completeness — sections present out of 3. (rank 2, 87%) */
  fitDocs: number
  /** Testing — coverage % if known, else 50 if tests exist, else 0. (~rank 17, 87%) */
  fitTesting: number
  /** Weighted sum of the six sub-scores, 0–100. */
  fitBase: number
  /** fitBase + Probabl-core boost (the only number that includes the boost). */
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
    latest_release_date?: string
  }
  pypi?: {
    version?: string
    release_date?: string
    requires_python?: string
    summary?: string
    downloads?: {
      last_day?: number
      last_week?: number
      last_month?: number
    }
  }
  /** Auto-fetched from codecov.io; absent if the project isn't on codecov
   *  or hasn't uploaded recent results. Refreshed daily by update_stats.py. */
  codecov?: {
    coverage: number
    active?: boolean
    branch?: string | null
  }
  /** Auto-fetched from coveralls.io as a fallback when codecov has no data
   *  (some projects publish to coveralls only). Refreshed daily. */
  coveralls?: {
    coverage: number
    branch?: string | null
  }
}
