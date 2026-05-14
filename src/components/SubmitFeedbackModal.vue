<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import FormSuccess from './FormSuccess.vue'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { sanitizeText } from '@/utils/submitForm'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const type = ref('')
const message = ref('')

const { status, submit, reset } = useFormSubmit()

const canSubmit = computed(() => !!type.value.trim() && !!message.value.trim())

function resetForm(): void {
  type.value = ''
  message.value = ''
  reset()
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) resetForm()
  },
)

async function onSubmit(): Promise<void> {
  if (!canSubmit.value || status.value === 'submitting') return
  await submit({
    form_name: 'feedback',
    type: sanitizeText(type.value),
    message: sanitizeText(message.value),
  })
}

function close(): void {
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Submit Feedback"
    subtitle="Share your thoughts, suggestions, or ideas to help improve scikit-learn Central."
    @close="close"
  >
    <FormSuccess
      v-if="status === 'success'"
      emoji="🙏"
      heading="Thank you!"
      @close="close"
    >
      Your feedback has been received.
    </FormSuccess>

    <form v-else class="modal__body" novalidate @submit.prevent="onSubmit">
      <div class="form-group">
        <label class="form-label" for="fb-type">
          Type of Feedback <span style="color:#c2640a">*</span>
        </label>
        <select id="fb-type" v-model="type" class="form-input" required>
          <option value="">Select…</option>
          <option value="suggestion">Suggestion</option>
          <option value="missing-package">Missing Package</option>
          <option value="missing-use-case">Missing Use Case</option>
          <option value="bug">Bug Report</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="fb-message">
          Message <span style="color:#c2640a">*</span>
        </label>
        <textarea
          id="fb-message"
          v-model="message"
          class="form-input form-input--textarea"
          rows="4"
          placeholder="Tell us what's on your mind…"
          required
        />
      </div>

      <p
        v-if="status === 'error'"
        class="form-submit-error"
        style="color:#c2640a;font-size:var(--text-sm);margin-top:var(--space-3);text-align:center"
      >
        Something went wrong. Please try again.
      </p>

      <div class="modal__footer">
        <button type="submit" class="btn btn--primary" :disabled="!canSubmit || status === 'submitting'">
          <i
            class="fas"
            :class="status === 'submitting' ? 'fa-spinner fa-spin' : 'fa-paper-plane'"
          ></i>
          {{ status === 'submitting' ? 'Sending…' : 'Submit' }}
        </button>
        <button type="button" class="btn btn--ghost" @click="close">Cancel</button>
      </div>
    </form>
  </BaseModal>
</template>
