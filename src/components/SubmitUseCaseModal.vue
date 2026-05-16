<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import FormSuccess from './FormSuccess.vue'
import { useFormSubmit } from '@/composables/useFormSubmit'
import {
  APPLICATION_FIELDS,
  DATA_TYPES,
  PROBLEM_TYPES,
  humanizeTaxonomyValue,
} from '@/types/usecase-taxonomy'
import { sanitizeText } from '@/utils/submitForm'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { status, submit, reset } = useFormSubmit()

const title = ref('')
const applicationFields = ref<Set<string>>(new Set())
const problemTypes = ref<Set<string>>(new Set())
const dataTypes = ref<Set<string>>(new Set())
const packages = ref('')
const synopsis = ref('')
const sampleCode = ref('')

function toggleApplicationField(value: string): void {
  const next = new Set(applicationFields.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  applicationFields.value = next
}

function toggleProblemType(value: string): void {
  const next = new Set(problemTypes.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  problemTypes.value = next
}

function toggleDataType(value: string): void {
  const next = new Set(dataTypes.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  dataTypes.value = next
}

function setToCsv(set: Set<string>): string {
  return [...set].sort().join(', ')
}

const canSubmit = computed(
  () =>
    !!title.value.trim() &&
    applicationFields.value.size > 0 &&
    problemTypes.value.size > 0 &&
    dataTypes.value.size > 0 &&
    !!packages.value.trim() &&
    !!synopsis.value.trim(),
)

function resetForm(): void {
  title.value = ''
  applicationFields.value = new Set()
  problemTypes.value = new Set()
  dataTypes.value = new Set()
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
    application_fields: sanitizeText(setToCsv(applicationFields.value)),
    problem_types: sanitizeText(setToCsv(problemTypes.value)),
    data_types: sanitizeText(setToCsv(dataTypes.value)),
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

    <form v-else class="modal-body" novalidate @submit.prevent="onSubmit">
      <div class="form-group">
        <label class="form-label" for="uc-title">
          Use Case Title <span class="req">*</span>
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

      <fieldset class="form-group taxonomy-fieldset">
        <legend class="form-label">
          Application Field <span class="req">*</span>
        </legend>
        <div class="taxonomy-options">
          <label
            v-for="slug in APPLICATION_FIELDS"
            :key="slug"
            class="taxonomy-option"
          >
            <input
              type="checkbox"
              :checked="applicationFields.has(slug)"
              @change="toggleApplicationField(slug)"
            />
            {{ humanizeTaxonomyValue(slug) }}
          </label>
        </div>
      </fieldset>

      <fieldset class="form-group taxonomy-fieldset">
        <legend class="form-label">
          Problem Type <span class="req">*</span>
        </legend>
        <div class="taxonomy-options">
          <label v-for="slug in PROBLEM_TYPES" :key="slug" class="taxonomy-option">
            <input
              type="checkbox"
              :checked="problemTypes.has(slug)"
              @change="toggleProblemType(slug)"
            />
            {{ humanizeTaxonomyValue(slug) }}
          </label>
        </div>
      </fieldset>

      <fieldset class="form-group taxonomy-fieldset">
        <legend class="form-label">
          Data Type <span class="req">*</span>
        </legend>
        <div class="taxonomy-options">
          <label v-for="slug in DATA_TYPES" :key="slug" class="taxonomy-option">
            <input
              type="checkbox"
              :checked="dataTypes.has(slug)"
              @change="toggleDataType(slug)"
            />
            {{ humanizeTaxonomyValue(slug) }}
          </label>
        </div>
      </fieldset>

      <div class="form-group">
        <label class="form-label" for="uc-packages">
          Packages Used <span class="req">*</span>
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
          Synopsis <span class="req">*</span>
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
          class="form-input form-input--textarea mono-textarea"
          rows="5"
          placeholder="Paste a short Python snippet (30–60 lines) using synthetic data…"
        />
      </div>

      <p v-if="status === 'error'" class="form-submit-error">
        Something went wrong. Please try again.
      </p>

      <div class="modal-footer">
        <button
          type="submit"
          class="btn btn--primary"
          :disabled="!canSubmit || status === 'submitting'"
        >
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

<style scoped>
.mono-textarea {
  font-family: var(--font-mono);
  font-size: 12px;
}

.taxonomy-fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.taxonomy-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-2);
}

.taxonomy-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
}
</style>
