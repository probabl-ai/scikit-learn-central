# AGENTS

- Avoid redundant comments that restate what obvious code already expresses.
- Smart/dumb pattern is mandatory: use stores/services only in `src/views/`.
- Components in `src/components/` must stay dumb and communicate through props, events, and models only.
- Reuse or extend components from `src/components/` before creating new UI controls.
- In `<script setup>`, keep declarations in this idiomatic order: props & emits → composable calls → injected values → refs → template refs → computed → functions → lifecycle hooks → watchers → `defineExpose`.
- Scoped CSS is mandatory; prefer nesting under one root class with short semantic names.
- Use `_theme.css` design tokens instead of ad-hoc values.