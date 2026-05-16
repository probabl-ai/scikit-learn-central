/**
 * Submission helpers for the Submit Package / Use Case / Feedback forms.
 * Posts to the probabl n8n webhook. Endpoint is identical to the legacy app.
 */

const WEBHOOK_URL =
  'https://probabl.app.n8n.cloud/webhook/7a6c6cfb-0631-4f86-80bc-80f29691372b'

/** Strip HTML tags, trim whitespace, cap to maxLen characters. */
export function sanitizeText(value: unknown, maxLen = 2000): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLen)
}

export type WebhookPayload =
  | {
      form_name: 'submit_package'
      name: string
      pypi_name: string
      repository: string
      description: string
    }
  | {
      form_name: 'submit_use_case'
      title: string
      application_fields: string
      problem_types: string
      data_types: string
      packages: string
      synopsis: string
      sample_code: string
    }
  | { form_name: 'feedback'; type: string; message: string }

/** POST a JSON payload to the webhook. Throws on network or HTTP errors. */
export async function postToWebhook(payload: WebhookPayload): Promise<void> {
  const r = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
}
