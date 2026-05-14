export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface UseCase {
  uuid: string
  slug: string
  title: string
  synopsis: string
  industry: string[]
  technique: string[]
  packages: string[]
  difficulty: Difficulty
  archived?: boolean
  has_notebook?: boolean
}

export interface UseCasesIndex {
  meta: {
    version: string
    count: number
    updated: string
  }
  use_cases: string[] | UseCase[]
}
