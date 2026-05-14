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

const title = ref('')
const industry = ref('')
const technique = ref('')
const packages = ref('')
const synopsis = ref('')
const sampleCode = ref('')

const { status, submit, reset } = useFormSubmit()

const canSubmit = computed(
  () =>
    !!title.value.trim() &&
    !!industry.value.trim() &&
    !!technique.value.trim() &&
    !!packages.value.trim() &&
    !!synopsis.value.trim(),
)

function resetForm(): void {
  title.value = ''
  industry.value = ''
  technique.value = ''
  packages.value = ''
  synopsis.value = ''
  sampleCode.value = ''
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
    form_name: 'submit_use_case',
    title: sanitizeText(title.value),
    industry: sanitizeText(industry.value),
    technique: sanitizeText(technique.value),
    packages: sanitizeText(packages.value),
    synopsis: sanitizeText(synopsis.value),
    sample_code: sanitizeText(sampleCode.value, 10000),
  })
}

function close(): void {
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Submit a Use Case"
    subtitle="Describe a real-world ML problem and the sklearn ecosystem libraries that solve it. We'll review and add it to the catalog."
    max-width="600px"
    @close="close"
  >
    <FormSuccess
      v-if="status === 'success'"
      emoji="🎉"
      heading="Thank you!"
      @close="close"
    >
      We received your use case: <strong>{{ title }}</strong>.
    </FormSuccess>

    <form v-else class="modal__body" novalidate @submit.prevent="onSubmit">
      <div class="form-group">
        <label class="form-label" for="uc-title">
          Use Case Title <span style="color:#c2640a">*</span>
        </label>
        <input
          id="uc-title"
          v-model="title"
          type="text"
          class="form-input"
          placeholder="e.g. Patient Readmission Prediction"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="uc-industry">
          Industry <span style="color:#c2640a">*</span>
        </label>
        <input
          id="uc-industry"
          v-model="industry"
          type="text"
          class="form-input"
          placeholder="e.g. healthcare, insurance"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="uc-technique">
          ML Technique <span style="color:#c2640a">*</span>
        </label>
        <input
          id="uc-technique"
          v-model="technique"
          type="text"
          class="form-input"
          placeholder="e.g. classification, survival-analysis"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="uc-packages">
          Packages Used <span style="color:#c2640a">*</span>
        </label>
        <input
          id="uc-packages"
          v-model="packages"
          type="text"
          class="form-input"
          placeholder="e.g. scikit-learn, skrub, shap"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="uc-synopsis">
          Synopsis <span style="color:#c2640a">*</span>
        </label>
        <textarea
          id="uc-synopsis"
          v-model="synopsis"
          class="form-input form-input--textarea"
          rows="3"
          placeholder="Describe the business problem and how ML solves it (2–3 sentences)."
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="uc-code">Sample Code (optional)</label>
        <textarea
          id="uc-code"
          v-model="sampleCode"
          class="form-input form-input--textarea"
          rows="5"
          style="font-family:var(--font-mono);font-size:12px"
          placeholder="Paste a short Python snippet (30–60 lines) using synthetic data…"
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
