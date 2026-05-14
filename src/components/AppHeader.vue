<script setup lang="ts">
defineProps<{
  submitLabel: string
}>()

defineEmits<{
  submit: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <div class="app-header__logo-wrap">
          <img
            src="https://scikit-learn.org/stable/_static/scikit-learn-logo-notext.png"
            alt="scikit-learn"
            onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg';"
          />
        </div>
        <div class="app-header__titles">
          <h1 class="app-header__title">scikit-learn Central</h1>
          <span class="app-header__subtitle">
            Ecosystem catalog &amp; use case explorer · by <strong>:probabl.</strong>
          </span>
        </div>
      </div>

      <div class="app-header__actions">
        <a href="https://probabl.ai" class="btn btn--ghost btn--sm">
          <i class="fas fa-globe"></i> probabl.ai
        </a>
        <a href="https://scikit-learn.org" target="_blank" class="btn btn--ghost btn--sm">
          <i class="fas fa-globe"></i> scikit-learn.org
        </a>
        <button class="btn btn--primary btn--sm" @click="$emit('submit')">
          <i class="fas fa-plus"></i>
          <span>{{ submitLabel }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
