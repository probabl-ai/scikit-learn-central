export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface UseCase {
  uuid: string
  slug: string
  title: string
  synopsis: string
  application_fields: string[]
  problem_types: string[]
  data_types: string[]
  packages: string[]
  difficulty: Difficulty
  archived?: boolean
}

export interface UseCasesIndex {
  meta: {
    version: string
    count: number
    updated: string
  }
  use_cases: string[] | UseCase[]
}
