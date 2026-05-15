import type { CorePackage } from './package'

export interface CatalogMeta {
  version: string
  name: string
  updated: string
  description: string
}

/** Raw shape of data/catalog.json: `packages` is an array of string IDs. */
export interface CatalogRaw {
  meta: CatalogMeta
  core: CorePackage
  packages: string[]
  /** Editorial highlight order on the catalog page; ids must exist in `packages`. */
  featured_packages: string[]
}
