import { computed, type ComputedRef, type Ref } from 'vue'
import type { UseCase } from '@/types/usecase'
import {
  APPLICATION_FIELDS,
  DATA_TYPES,
  PROBLEM_TYPES,
  humanizeTaxonomyValue,
  type TaxonomyDimension,
} from '@/types/usecase-taxonomy'

export type UseCaseGroupByKey = 'none' | TaxonomyDimension

export interface UseCaseGroupSection {
  key: string
  label: string
  useCases: UseCase[]
}

function valuesForDimension(uc: UseCase, dimension: TaxonomyDimension): string[] {
  if (dimension === 'application-field') return uc.application_fields ?? []
  if (dimension === 'problem-type') return uc.problem_types ?? []
  return uc.data_types ?? []
}

function allowlistForDimension(dimension: TaxonomyDimension): readonly string[] {
  if (dimension === 'application-field') return APPLICATION_FIELDS
  if (dimension === 'problem-type') return PROBLEM_TYPES
  return DATA_TYPES
}

export function useUseCaseCatalogGroups(
  useCases: Ref<UseCase[]> | ComputedRef<UseCase[]>,
  groupBy: Ref<UseCaseGroupByKey> | ComputedRef<UseCaseGroupByKey>,
) {
  const groupedSections = computed<UseCaseGroupSection[]>(() => {
    const list = useCases.value
    const mode = groupBy.value

    if (mode === 'none') {
      return [{ key: 'all', label: '', useCases: list }]
    }

    const allowlist = allowlistForDimension(mode)
    const buckets = new Map<string, UseCase[]>()

    for (const slug of allowlist) {
      buckets.set(slug, [])
    }

    for (const uc of list) {
      const seen = new Set<string>()
      for (const slug of valuesForDimension(uc, mode)) {
        if (seen.has(slug) || !buckets.has(slug)) continue
        seen.add(slug)
        buckets.get(slug)!.push(uc)
      }
    }

    const sections: UseCaseGroupSection[] = []
    for (const slug of allowlist) {
      const group = buckets.get(slug)!
      if (!group.length) continue
      sections.push({
        key: slug,
        label: humanizeTaxonomyValue(slug),
        useCases: group,
      })
    }

    return sections
  })

  return { groupedSections }
}
