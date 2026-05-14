<script setup lang="ts" generic="T extends string">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  label: string
  options: ReadonlyArray<{ value: T; label: string; count?: number }>
  modelValue: Set<T>
}>()

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
      <label
        v-for="opt in options"
        :key="opt.value"
        class="filter-panel__item filter-option"
      >
        <input
          type="checkbox"
          :checked="modelValue.has(opt.value)"
          @change="toggleOption(opt.value)"
        />
        <span class="filter-panel__label">{{ opt.label }}</span>
        <span v-if="opt.count != null" class="filter-panel__count">{{ opt.count }}</span>
      </label>
    </div>
  </div>
</template>
