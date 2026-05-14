import { ref, type Ref } from 'vue'
import type { UseCase } from '@/types/usecase'

const useCaseModules = import.meta.glob<{ default: UseCase }>(
  '@data/use-cases/*.json',
  { eager: true },
)

const cache: Ref<UseCase[]> = ref(loadAll())

function loadAll(): UseCase[] {
  return Object.values(useCaseModules)
    .map((mod) => mod.default)
    .filter((uc): uc is UseCase => !!uc && !uc.archived)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function useUseCases() {
  return { useCases: cache }
}
