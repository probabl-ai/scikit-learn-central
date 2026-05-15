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

/* Build an ordered list of {group, items[]} from the flat options array.
   Always returns a Group[] so consumers don't need to handle two shapes. */
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

const emit = defineEmits<{
  'update:modelValue': [value: Set<T>]
}>()

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

/* ── Group-level (tier) selection helpers ─────────────────────────────
   When grouped, the group header itself is a checkbox that selects /
   deselects every sub-option in that group at once. Tri-state: empty
   when no sub is selected, indeterminate when some are, checked when
   all are. */
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
      class="filter-btn"
      :class="{ 'is-open': open, 'has-active': activeCount > 0 }"
      @click="toggle"
    >
      {{ label }}
      <span v-show="activeCount > 0" class="filter-btn__badge">{{ activeCount }}</span>
      <i class="fas fa-chevron-down"></i>
    </button>
    <div class="filter-panel" :class="{ 'is-open': open }">
      <template v-for="(g, gi) in grouped" :key="g.group ?? gi">
        <label
          v-if="g.group"
          class="filter-panel__item filter-panel__group-row"
          :data-state="groupState(g)"
        >
          <input
            type="checkbox"
            :checked="groupState(g) === 'all'"
            :indeterminate.prop="groupState(g) === 'partial'"
            @change="toggleGroup(g)"
          />
          <span class="filter-panel__group-label">{{ g.group }}</span>
        </label>
        <label
          v-for="opt in g.items"
          :key="opt.value"
          class="filter-panel__item filter-option filter-panel__item--child"
        >
          <input
            type="checkbox"
            :checked="modelValue.has(opt.value)"
            @change="toggleOption(opt.value)"
          />
          <span class="filter-panel__label">{{ opt.label }}</span>
          <span v-if="opt.count != null" class="filter-panel__count">{{ opt.count }}</span>
        </label>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Group header row: visually distinct from item rows (uppercase mono,
   slight tint), but it's still a label+checkbox so clicks toggle every
   item in the tier. */
.filter-panel__group-row {
  border-top: 1px solid var(--neutral-100);
  margin-top: 2px;
  background: var(--neutral-050);
}
.filter-panel__group-row:first-child {
  border-top: none;
  margin-top: 0;
}
.filter-panel__group-label {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
/* Indeterminate (partial) state — colour the label so a partial pick
   reads as "this tier is filtered". */
.filter-panel__group-row[data-state='partial'] .filter-panel__group-label,
.filter-panel__group-row[data-state='all'] .filter-panel__group-label {
  color: var(--text-primary);
}

/* Indent sub-items so the tier hierarchy is visible. */
.filter-panel__item--child {
  padding-left: var(--space-6, 24px);
}
</style>
