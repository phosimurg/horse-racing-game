---
paths:
  - 'src/**/*.vue'
---

# Vue component rules

- Blocks in order: `<script setup lang="ts">`, `<template>`, `<style scoped>`.
- Script sections in order: imports, `defineProps` and `defineEmits`, composables and stores, refs and reactive state, computed values, functions, lifecycle hooks.
- Only `*View.vue` components use stores or composables; every other component receives props and emits events.
- Type props and emits with TypeScript generics, never mutate props, and use `defineModel` for two-way bindings.
- Keep templates declarative; move logic into computed values or functions.
- Semantic HTML first: native `button`, `table` with `caption` and `th scope`, landmarks and ordered headings. Add ARIA only where the WAI-ARIA APG pattern requires it.
- Interactive elements are keyboard operable, show a visible focus style and have a target of at least 24 by 24 CSS pixels.
- Names are multi-word PascalCase; components in `components/ui` start with `Base` unless they are single-purpose primitives such as `SkipLink`.
- Comments only where the intent is not obvious from names.
