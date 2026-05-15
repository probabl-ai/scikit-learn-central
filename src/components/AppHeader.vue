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
    <div class="inner">
      <div class="brand">
        <div class="logo-wrap">
          <img
            src="https://scikit-learn.org/stable/_static/scikit-learn-logo-notext.png"
            alt="scikit-learn"
            onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg';"
          />
        </div>
        <div class="titles">
          <h1 class="title">scikit-learn Central</h1>
          <span class="subtitle">
            Ecosystem catalog &amp; use case explorer · by <strong>:probabl.</strong>
          </span>
        </div>
      </div>

      <div class="actions">
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

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 200;
  height: var(--header-h);
  background: var(--color-midnight);
  border-bottom: 1px solid var(--color-midnight-line);
  display: flex;
  align-items: center;
}

.inner {
  width: 100%;
  max-width: calc(var(--sidebar-w) + var(--content-max) + var(--space-8));
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.logo-wrap {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  background: var(--neutral-000);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.logo-wrap img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--body-xl);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--text-inverse);
  line-height: 1;
}

.subtitle {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-on-dark-muted);
  letter-spacing: var(--tracking-wide);
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .subtitle {
    display: none;
  }

  .title {
    font-size: var(--text-lg);
  }

  .actions :deep(.btn--ghost) {
    display: none;
  }
}
</style>
