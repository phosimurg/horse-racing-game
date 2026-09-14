# ADR 0001: Architecture and state ownership

- Status: Accepted
- Date: 2026-09-14
- Related: [Design sections 2 and 5](../specs/design.md), [Requirements](../specs/requirements.md)

## Context and problem statement

The brief asks for a Vue application structured "as if for a large-scale project", with Vuex or Pinia and a component-based design, and it evaluates component structure, code organization and state management.

The game combines three things:
- Pure rules: random horses, schedules and a race simulation.
- A lifecycle with pause and resume.
- Animation at display refresh rate.

The architecture must keep the rules testable, the state explainable and the interface replaceable, without ceremony the scope cannot justify.

## Decision drivers

- Business rules testable without a browser or Vue.
- One owner for every piece of state.
- A readable Pinia devtools timeline and synchronous store tests.
- A structure Insider One engineers recognize: Vue 3, TypeScript, Pinia, scoped styles and their documented folder layout.
- No dependency without a concrete need.

## Considered options

1. Feature-Sliced Design (app, pages, widgets, features, entities, shared).
2. Insider One's documented layout (`components/ui`, `components/common`, `composables`, `stores`, `views`, `utils`) plus a pure `domain` layer.
3. A store-centric design where Pinia stores hold all logic, including the per-frame clock.

## Decision outcome

Chosen option 2.

- `src/domain` holds the pure TypeScript rules and simulation, with no access to Vue, Pinia or the DOM.
- Pinia setup stores own global state (roster, program, results, lifecycle status) and change only on user actions and round boundaries.
- `useRacePlayback` owns the per-frame clock. It delegates time arithmetic to the pure `advancePlayback` reducer and reports round completions to the race store.
- Only `RaceDashboardView.vue` reads stores and calls composables; every other component is props in, events out.
- ESLint `no-restricted-imports` and `no-restricted-globals` enforce the layer rules in design section 2.1.

Option 1 adds five layers of ceremony that a single-screen game cannot justify, and it departs from the layout Insider One documents. Option 3 would dispatch a store action on every frame, which floods the Pinia devtools timeline and ties store tests to timers.

## Dependencies deliberately left out

- **vue-router:**
  - The game is a single screen with no addressable views.
  - Its only URL state is `?seed`, read once with `URLSearchParams`.
  - A router would add a dependency, configuration and test surface with no user value.
  - `views/` already follows the page structure, so adding routes later touches only `main.ts` and `App.vue`.
- **Component library** (Vuetify, PrimeVue, Element Plus and similar):
  - The brief evaluates component structure, and a library would hide exactly that.
  - The interface needs six primitives. Only the tabs have complex behavior, and they follow the WAI-ARIA APG pattern with keyboard tests.
  - A styled library's visual language fights the custom broadcast design and adds bundle weight that works against NFR-05.
  - Insider One builds its own design system in Vue.
  - If complex widgets such as comboboxes, date pickers or data grids become necessary, the next step is a headless library such as Reka UI, not a styled one.
- **Tailwind CSS:**
  - Insider One documents scoped styles with CSS custom-property tokens as its standard, and GitHub code search finds no Tailwind in its public repositories, so reviewers read familiar code.
  - The signature visuals need custom CSS anyway (turf stripes, checkered finish, grain, container queries, cascade layers, keyframes), and utilities would turn them into arbitrary values.
  - Modern CSS covers what Tailwind historically solved, without a build plugin or class-sorting tooling: custom properties, nesting, `color-mix()`, container queries, `@layer`, logical properties and `clamp()`.
  - Tailwind v4 remains a valid choice; it is left out for alignment and design reasons, not capability.
- **Sass:** Insider One's packages use it, but native nesting and custom properties make it unnecessary here.
- **Vuex:** it is in maintenance mode, Pinia is the official recommendation, and Insider One has migrated to Pinia.

## Consequences

- Good: domain logic is portable and fully covered by unit and mutation tests.
- Good: stores stay small and synchronous, and presentational components are reusable and simple to test.
- Good: the structure is familiar to Insider One reviewers.
- Bad: playback lives in a composable that the view must call exactly once; a component test guards this.
- Bad: the in-house UI kit is ours to maintain, which is acceptable for six primitives.

## Revisit when

- A second screen is needed: add vue-router.
- Complex form widgets are needed: adopt a headless component library.
- Multiplayer or server-authoritative races are needed: move `domain` to a shared package.

## References

- Insider One Engineering, [How We Keep Frontend Code Clean in a Fast-Growing Product](https://medium.com/insiderengineering/how-we-keep-frontend-code-clean-in-a-fast-growing-product-3f764c71ab8a), 2026-02-03
- Insider One Engineering, [Migrating from Vuex to Pinia: A Complete Guide](https://medium.com/insiderengineering/migrating-from-vuex-to-pinia-a-complete-guide-31771d912f13), 2026-01-19
- Insider One Engineering, [From React to Vue: How We Migrated Our Frontend Under One Rails Roof](https://medium.com/insiderengineering/from-react-to-vue-how-we-migrated-our-frontend-under-one-rails-roof-01a8b6ee219f), 2026-02-24
- Insider One Engineering, [Css innovative use: Custom Properties and Variables](https://medium.com/insiderengineering/css-innovative-use-custom-properties-and-variables-296340c168e1), 2024-04-29
- Insider One Engineering, [Front-End Architecture Part I](https://medium.com/insiderengineering/front-end-architecture-part-%E2%85%B0-d5d1c6f87f12), 2022-05-23
- Pinia, [Defining a Store](https://pinia.vuejs.org/core-concepts/)
- Vue.js, [Style Guide](https://vuejs.org/style-guide/)
- W3C WAI-ARIA Authoring Practices Guide, [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
