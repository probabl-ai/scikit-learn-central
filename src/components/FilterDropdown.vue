<script setup lang="ts" generic="T extends string">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Option {
  value: T
  label: string
  count?: number
  group?: string
}
interface Group {
  group: string | undefined
  items: Option[]
}

const props = defineProps<{
  label: string
  /** Flat list of options. When `group` is set on an option, the panel
   *  renders headers in the order of first appearance — keeps grouped and
   *  flat variants in one component. */
  options: ReadonlyArray<Option>
  modelValue: Set<T>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Set<T>]
}>()

const grouped = computed<Group[]>(() => {
  const out: Group[] = []
  const seen = new Map<string, number>()
  for (const opt of props.options) {
    const key = opt.group ?? ''
    let idx = seen.get(key)
    if (idx == null) {
      idx = out.length
      seen.set(key, idx)
      out.push({ group: opt.group, items: [] })
    }
    out[idx].items.push(opt)
  }
  return out
})

const open = ref(false)
const root = ref<HTMLDivElement | null>(null)

const activeCount = computed(() => props.modelValue.size)

function toggle(): void {
  open.value = !open.value
}

function toggleOption(val: T): void {
  const next = new Set(props.modelValue)
  if (next.has(val)) next.delete(val)
  else next.add(val)
  emit('update:modelValue', next)
}

function groupState(g: Group): 'none' | 'partial' | 'all' {
  const total = g.items.length
  if (total === 0) return 'none'
  let n = 0
  for (const o of g.items) if (props.modelValue.has(o.value)) n++
  if (n === 0) return 'none'
  if (n === total) return 'all'
  return 'partial'
}

function toggleGroup(g: Group): void {
  const next = new Set(props.modelValue)
  const allSelected = g.items.every((o) => next.has(o.value))
  for (const o of g.items) {
    if (allSelected) next.delete(o.value)
    else next.add(o.value)
  }
  emit('update:modelValue', next)
}

function onDocClick(e: MouseEvent): void {
  if (!root.value) return
  if (!root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="filter-group">
    <button
      type="button"
      class="trigger"
      :class="{ 'is-open': open, 'has-active': activeCount > 0 }"
      @click="toggle"
    >
      {{ label }}
      <span v-show="activeCount > 0" class="badge">{{ activeCount }}</span>
      <i class="fas fa-chevron-down"></i>
    </button>
    <div class="panel filter-panel" :class="{ 'is-open': open }">
      <template v-for="(g, gi) in grouped" :key="g.group ?? gi">
        <label
          v-if="g.group"
          class="row group-row"
          :data-state="groupState(g)"
        >
          <input
            type="checkbox"
            :checked="groupState(g) === 'all'"
            :indeterminate.prop="groupState(g) === 'partial'"
            @change="toggleGroup(g)"
          />
          <span class="group-label">{{ g.group }}</span>
        </label>
        <label v-for="opt in g.items" :key="opt.value" class="row option child">
          <input
            type="checkbox"
            :checked="modelValue.has(opt.value)"
            @change="toggleOption(opt.value)"
          />
          <span class="opt-label">{{ opt.label }}</span>
          <span v-if="opt.count != null" class="opt-count">{{ opt.count }}</span>
        </label>
      </template>
    </div>
  </div>
</template>

<style scoped>
.filter-group {
  position: relative;
}

.trigger {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0 14px;
  height: 34px;
  border: 1px solid var(--neutral-300);
  background: var(--bg-surface);
  color: var(--color-near-black);
  border-radius: var(--radius-full);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition:
    border-color 0.14s,
    background 0.14s,
    color 0.14s;
  user-select: none;
}

.trigger:hover {
  border-color: var(--color-near-black);
  color: var(--color-near-black);
}

.trigger.has-active {
  background: var(--color-near-black);
  border-color: var(--color-near-black);
  color: var(--text-inverse);
}

.trigger.is-open {
  border-color: var(--color-near-black);
  color: var(--color-near-black);
  background: var(--surface-near-black-ghost-open);
}

.trigger.has-active.is-open {
  background: var(--color-midnight);
  color: var(--text-inverse);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-orange);
  color: var(--color-near-black);
  border-radius: 9px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.trigger .fa-chevron-down {
  font-size: 9px;
  transition: transform 0.15s;
}

.trigger.is-open .fa-chevron-down {
  transform: rotate(180deg);
}

.panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1.5px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-midnight-panel);
  z-index: 300;
  padding: var(--space-2) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--neutral-300) transparent;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.97);
  transform-origin: top left;
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out),
    visibility 180ms;
}

.panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: background 0.1s;
  gap: var(--space-3);
}

.row:hover {
  background: var(--neutral-050);
}

.row input[type='checkbox'] {
  accent-color: var(--color-near-black);
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.opt-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--neutral-700);
  flex: 1;
}

.opt-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--neutral-400);
  min-width: 20px;
  text-align: right;
}

.group-row {
  border-top: 1px solid var(--neutral-100);
  margin-top: 2px;
  background: var(--neutral-050);
}

.group-row:first-child {
  border-top: none;
  margin-top: 0;
}

.group-label {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.group-row[data-state='partial'] .group-label,
.group-row[data-state='all'] .group-label {
  color: var(--text-primary);
}

.row.child {
  padding-left: var(--space-6, 24px);
}
</style>
