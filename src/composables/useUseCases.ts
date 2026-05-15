import { computed, ref, type ComputedRef, type Ref } from 'vue'
import useCasesIndex from '@data/use-cases.json'
import type { UseCase, UseCasesIndex } from '@/types/usecase'

const index = useCasesIndex as unknown as UseCasesIndex

const useCaseModules = import.meta.glob<{ default: UseCase }>(
  '@data/use-cases/*.json',
  { eager: true },
)

/** Map uuid → bundled use-case JSON so we can resolve entries from the index. */
const byUuid = new Map<string, UseCase>()
for (const mod of Object.values(useCaseModules)) {
  if (mod.default) byUuid.set(mod.default.uuid, mod.default)
}

/**
 * Use `data/use-cases.json` as the published allowlist (matches the legacy
 * loader). Other JSON files in `data/use-cases/` are drafts that live in the
 * repo but should NOT appear on the site until they're added to the index.
 */
function loadAll(): UseCase[] {
  const allowlist = Array.isArray(index.use_cases)
    ? (index.use_cases as Array<string | UseCase>)
    : []
  const uuids = allowlist.map((entry) =>
    typeof entry === 'string' ? entry : entry.uuid,
  )
  return uuids
    .map((id) => byUuid.get(id))
    .filter((uc): uc is UseCase => !!uc && !uc.archived)
    .sort((a, b) => a.title.localeCompare(b.title))
}

const cache: Ref<UseCase[]> = ref(loadAll())

/** packageId → ordered list of use cases that reference it.
 *  Lets the package card render concrete task-level proofs (titles), not
 *  just a count — matching Nadi & Sakr's "fit-for-purpose at the task level". */
const useCasesByPackage: ComputedRef<Map<string, UseCase[]>> = computed(() => {
  const m = new Map<string, UseCase[]>()
  for (const uc of cache.value) {
    for (const id of uc.packages) {
      const list = m.get(id)
      if (list) list.push(uc)
      else m.set(id, [uc])
    }
  }
  return m
})

export function useUseCases() {
  return { useCases: cache, useCasesByPackage }
}
