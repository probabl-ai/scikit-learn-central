import { ref, toValue, type MaybeRefOrGetter } from 'vue'

export function useCopyPipInstall(pypiName: MaybeRefOrGetter<string | undefined>) {
  const copied = ref(false)

  async function copyInstall(): Promise<void> {
    const name = toValue(pypiName)
    if (!name) return
    try {
      await navigator.clipboard.writeText(`pip install ${name}`)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  return { copied, copyInstall }
}
