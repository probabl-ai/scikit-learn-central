# AGENTS

- Avoid redundant comments that restate what obvious code already expresses.
- Smart/dumb pattern is mandatory: use stores/services only in `src/views/`.
- Components in `src/components/` must stay dumb and communicate through props, events, and models only.
  - **Pragmatic exceptions (keep thin, document here):** submit modals may call `useFormSubmit` for the webhook flow until a view-owned orchestration layer exists. Presentation components may use `useRoute` / `useRouter` for tab highlighting or resolving share URLs when the alternative is heavy prop-drilling with no business logic in the parent.
- Reuse or extend components from `src/components/` before creating new UI controls.
- In `<script setup>`, keep declarations in this idiomatic order: props & emits → composable calls → injected values → refs → template refs → computed → functions → lifecycle hooks → watchers → `defineExpose`.
- Scoped CSS is mandatory; prefer nesting under one root class with short semantic names. Page-level views in `src/views/` and `App.vue` should include `<style scoped>` for view-specific layout (shared chrome may remain in `components.css` until migrated).
- Use design tokens from [`src/assets/css/design-system.css`](src/assets/css/design-system.css) via `var(--*)` instead of ad-hoc raw colors or magic numbers.
