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

const name = ref('')
const pypiName = ref('')
const repository = ref('')
const description = ref('')

const { status, submit, reset } = useFormSubmit()

const canSubmit = computed(
  () => !!name.value.trim() && !!pypiName.value.trim() && !!repository.value.trim(),
)

function resetForm(): void {
  name.value = ''
  pypiName.value = ''
  repository.value = ''
  description.value = ''
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
    form_name: 'submit_package',
    name: sanitizeText(name.value),
    pypi_name: sanitizeText(pypiName.value),
    repository: sanitizeText(repository.value),
    description: sanitizeText(description.value),
  })
}

function close(): void {
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Submit a Package"
    subtitle="Know a scikit-learn compatible package that belongs in this catalog?"
    @close="close"
  >
    <FormSuccess
      v-if="status === 'success'"
      emoji="🎉"
      heading="Thank you!"
      @close="close"
    >
      We received your submission for <strong>{{ name }}</strong>.
    </FormSuccess>

    <form v-else class="modal__body" novalidate @submit.prevent="onSubmit">
      <div class="form-group">
        <label class="form-label" for="pkg-name">
          Package Name <span style="color:#c2640a">*</span>
        </label>
        <input
          id="pkg-name"
          v-model="name"
          type="text"
          class="form-input"
          placeholder="e.g. My sklearn extension"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="pkg-pypi">
          PyPI Name <span style="color:#c2640a">*</span>
        </label>
        <input
          id="pkg-pypi"
          v-model="pypiName"
          type="text"
          class="form-input"
          placeholder="e.g. my-sklearn-extension"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="pkg-repo">
          Repository URL <span style="color:#c2640a">*</span>
        </label>
        <input
          id="pkg-repo"
          v-model="repository"
          type="url"
          class="form-input"
          placeholder="https://github.com/org/repo"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="pkg-desc">Short Description</label>
        <textarea
          id="pkg-desc"
          v-model="description"
          class="form-input form-input--textarea"
          rows="3"
          placeholder="What does it do and how does it integrate with scikit-learn?"
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
