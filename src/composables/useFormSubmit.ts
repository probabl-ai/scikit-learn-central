import { ref, type Ref } from 'vue'
import { postToWebhook, type WebhookPayload } from '@/utils/submitForm'

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface UseFormSubmit {
  status: Ref<FormStatus>
  submit: (payload: WebhookPayload) => Promise<void>
  reset: () => void
}

export function useFormSubmit(): UseFormSubmit {
  const status: Ref<FormStatus> = ref('idle')

  async function submit(payload: WebhookPayload): Promise<void> {
    status.value = 'submitting'
    try {
      await postToWebhook(payload)
      status.value = 'success'
    } catch {
      status.value = 'error'
    }
  }

  function reset(): void {
    status.value = 'idle'
  }

  return { status, submit, reset }
}
