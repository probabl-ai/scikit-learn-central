import { ref, type Ref } from 'vue'

export type SubmitModalName = 'package' | 'use-case' | 'feedback' | null

const active: Ref<SubmitModalName> = ref(null)

export function useSubmitModal() {
  function open(name: Exclude<SubmitModalName, null>): void {
    active.value = name
  }
  function close(): void {
    active.value = null
  }
  return { active, open, close }
}
