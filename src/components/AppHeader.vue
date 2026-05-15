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
        <button class="btn btn--primary btn--sm" type="button" @click="$emit('submit')">
          <i class="fas fa-plus" aria-hidden="true"></i>
          <span class="header-submit-label">{{ submitLabel }}</span>
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
  padding-top: env(safe-area-inset-top, 0px);
  min-height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
  background: var(--color-midnight);
  border-bottom: 1px solid var(--color-midnight-line);
  display: flex;
  align-items: center;
}

.inner {
  width: 100%;
  max-width: calc(var(--sidebar-w) + var(--content-max) + var(--space-8));
  margin: 0 auto;
  padding: 0 max(var(--space-6), env(safe-area-inset-right, 0px))
    0 max(var(--space-6), env(safe-area-inset-left, 0px));
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.actions :deep(.btn--primary.btn--sm) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 2.75rem;
  min-height: 2.75rem;
}

@media (max-width: 640px) {
  .subtitle {
    display: none;
  }

  .title {
    font-size: var(--text-lg);
  }

  .inner {
    gap: var(--space-3);
    padding-left: max(var(--space-4), env(safe-area-inset-left, 0px));
    padding-right: max(var(--space-4), env(safe-area-inset-right, 0px));
  }

  .actions :deep(.btn--ghost) {
    display: none;
  }

  .header-submit-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
