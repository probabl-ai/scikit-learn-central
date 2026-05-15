import { ref, type Ref } from 'vue'

const visible: Ref<boolean> = ref(false)
const message: Ref<string> = ref('')
let dismissTimer: ReturnType<typeof setTimeout> | undefined

export function useTransientFeedback() {
  function dismiss(): void {
    visible.value = false
    if (dismissTimer !== undefined) {
      clearTimeout(dismissTimer)
      dismissTimer = undefined
    }
  }

  function show(msg: string, durationMs = 2200): void {
    if (dismissTimer !== undefined) clearTimeout(dismissTimer)
    message.value = msg
    visible.value = true
    dismissTimer = setTimeout(dismiss, durationMs)
  }

  return { visible, message, show, dismiss }
}
