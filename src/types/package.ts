export type Nature = 'library' | 'extension' | 'application'
export type Scope = 'core' | 'incremental' | 'verticalized'
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
  nature: Nature
  scope: Scope
  license: License
  probabl?: boolean
  archived?: boolean
  provides_estimators: boolean
  consumes_estimators: boolean
  description: string
  tags: string[]
}

export interface CorePackage extends Omit<PackageRaw, 'nature' | 'scope'> {
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
