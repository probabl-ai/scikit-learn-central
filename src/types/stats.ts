import type { PackageStats } from './package'

export interface StatsFile {
  meta?: {
    updated?: string
    [k: string]: unknown
  }
  packages: Record<string, PackageStats>
}
