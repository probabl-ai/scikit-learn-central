<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import DifficultyBadge from '@/components/DifficultyBadge.vue'
import type { UseCase } from '@/types/usecase'
import {
  filterKnownApplicationFields,
  filterKnownDataTypes,
  filterKnownProblemTypes,
  formatKnownList,
} from '@/types/usecase-taxonomy'

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

const classificationSummary = computed(() => {
  const uc = props.useCase
  if (!uc) return []
  return [
    {
      label: 'Application Field',
      value: formatKnownList(uc.application_fields ?? [], filterKnownApplicationFields),
    },
    {
      label: 'Problem Type',
      value: formatKnownList(uc.problem_types ?? [], filterKnownProblemTypes),
    },
    { label: 'Data Type', value: formatKnownList(uc.data_types ?? [], filterKnownDataTypes) },
  ]
})

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
    class="backdrop code-modal-backdrop"
    :class="{ 'is-open': open }"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div v-if="useCase" class="panel code-modal">
      <div class="head">
        <div>
          <div class="title">{{ useCase.title }}</div>
          <div class="meta">
            <DifficultyBadge :difficulty="useCase.difficulty" />
            <span
              v-for="row in classificationSummary"
              :key="row.label"
              class="code-modal-classification"
            >
              <span class="code-modal-classification-label">{{ row.label }}:</span>
              {{ row.value }}
            </span>
          </div>
        </div>
        <button class="close" aria-label="Close" @click="close">&times;</button>
      </div>

      <div class="synopsis">{{ useCase.synopsis }}</div>

      <div class="body">
        <pre ref="codeEl" class="pre language-python">{{ code }}</pre>
      </div>

      <div class="foot">
        <div>
          <div class="packages-label">Libraries used</div>
          <div class="package-chips">
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
        <div class="foot-actions">
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

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop-midnight-heavy);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity var(--duration-lg) var(--ease-out),
    visibility var(--duration-lg);
}

.backdrop.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.panel {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-midnight-deep);

  transform: scale(0.97);
  transition: transform var(--duration-lg) var(--ease-out);
}

.backdrop.is-open .panel {
  transform: scale(1);
}

.head {
  background: var(--color-near-black);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-shrink: 0;
}

.title {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-orange);
  line-height: 1.2;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.code-modal-classification {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-inverse-muted, rgba(255, 255, 255, 0.75));
}

.code-modal-classification-label {
  color: var(--text-inverse);
  font-weight: 600;
}

.close {
  background: var(--surface-on-dark-raised);
  border: 1px solid var(--border-on-dark-muted);
  color: var(--text-inverse);
  font-size: 20px;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s;
}

.close:hover {
  background: var(--surface-on-dark-strong);
}

.synopsis {
  padding: var(--space-4) var(--space-6);
  background: var(--neutral-050);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--neutral-700);
  line-height: 1.65;
  border-bottom: 1px solid var(--neutral-200);
  flex-shrink: 0;
}

.body {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.pre {
  margin: 0;
  padding: var(--space-5) var(--space-6);
  background: var(--surface-code);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-code);
  white-space: pre;
  min-height: 200px;
}

.body :deep(.hljs) {
  background: var(--surface-code) !important;
}

.foot {
  padding: var(--space-3) var(--space-6);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-shrink: 0;
  background: var(--bg-surface);
}

.packages-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--neutral-500);
  font-weight: 600;
}

.package-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.foot-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
</style>
