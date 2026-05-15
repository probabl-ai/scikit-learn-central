<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import type { UseCase } from '@/types/usecase'

const props = defineProps<{
  useCase: UseCase | null
}>()

const emit = defineEmits<{
  close: []
}>()

const open = computed(() => props.useCase !== null)

const code = ref<string>('Loading…')
const codeEl = ref<HTMLPreElement | null>(null)
const copied = ref(false)

// Lazily load .py source. Vite turns each match into its own dynamic-import chunk.
const codeLoaders = import.meta.glob<string>('@data/use-cases/*.py', {
  query: '?raw',
  import: 'default',
})

async function loadCode(uuid: string): Promise<string> {
  const key = Object.keys(codeLoaders).find((p) => p.endsWith(`/${uuid}.py`))
  if (!key) return '# Code not available.'
  try {
    return await codeLoaders[key]()
  } catch {
    return '# Code not available.'
  }
}

watch(
  () => props.useCase,
  async (uc) => {
    if (!uc) return
    code.value = 'Loading…'
    document.body.style.overflow = 'hidden'
    code.value = await loadCode(uc.uuid)
    await nextTick()
    if (codeEl.value && window.hljs) {
      codeEl.value.removeAttribute('data-highlighted')
      window.hljs.highlightElement(codeEl.value)
    }
  },
)

function close(): void {
  document.body.style.overflow = ''
  emit('close')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && open.value) close()
}
document.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

const githubUrl = computed(() =>
  props.useCase
    ? `https://github.com/probabl-ai/scikit-learn-central/blob/main/data/use-cases/${props.useCase.uuid}.py`
    : '#',
)

async function copyCode(): Promise<void> {
  if (!codeEl.value) return
  try {
    await navigator.clipboard.writeText(codeEl.value.textContent ?? '')
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // silent
  }
}
</script>

<template>
  <div
    class="code-modal-backdrop"
    :class="{ 'is-open': open }"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div v-if="useCase" class="code-modal">
      <div class="code-modal__header">
        <div>
          <div class="code-modal__title">{{ useCase.title }}</div>
          <div class="code-modal__meta">
            <DifficultyBadge :difficulty="useCase.difficulty" />
            <span v-for="i in useCase.industry" :key="i" class="industry-tag">{{ i }}</span>
            <span v-for="t in useCase.technique" :key="t" class="technique-tag">
              {{ t.replace(/-/g, ' ') }}
            </span>
          </div>
        </div>
        <button class="code-modal__close" aria-label="Close" @click="close">&times;</button>
      </div>

      <div class="code-modal__synopsis">{{ useCase.synopsis }}</div>

      <div class="code-modal__body">
        <pre ref="codeEl" class="code-modal__pre language-python">{{ code }}</pre>
      </div>

      <div class="code-modal__footer">
        <div>
          <div class="code-modal__packages-label">Libraries used</div>
          <div class="code-modal__package-chips">
            <span
              v-for="pid in useCase.packages"
              :key="pid"
              class="uc-package-chip"
              :class="{ 'uc-package-chip--core': pid === 'scikit-learn' }"
            >
              {{ pid }}
            </span>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <a
            :href="githubUrl"
            target="_blank"
            rel="noopener"
            class="btn--github-square"
            title="View on GitHub"
          >
            <i class="fab fa-github"></i>
          </a>
          <button class="btn--copy-code" @click="copyCode">
            <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i>
            {{ copied ? 'Copied!' : 'Copy Code' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
