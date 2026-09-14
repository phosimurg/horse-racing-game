# Implementation Plan

| Field | Value |
| --- | --- |
| Status | Approved on 2026-09-14; historical record |
| Living documents | [Requirements](specs/requirements.md), [Design](specs/design.md), [Tasks](specs/tasks.md), [ADRs](adr/) |
| Changes after approval | Recorded in ADRs and `specs/tasks.md`; this file is not rewritten |

This is the plan approved before any feature code was written. An AI coding agent drafted it and a separate AI planning agent reviewed it independently. The author then revised and approved it. The planning log in [ai-workflow.md](ai-workflow.md) records what the review changed.

## 1. Context

Insider One (useinsider.com now redirects to insiderone.com) sent a take-home brief for an interactive horse racing game: a 2-page PDF with an example UI on page 2. The deliverable must meet 100% of the brief, behave like production software, and show the engineering and AI-native practices Insider One publicly expects. The repository is greenfield; the untouched `create-vue` scaffold is the committed baseline so reviewers can diff every decision against it.

Brief essentials:
- Vue, with Vuex or Pinia and a component-based design.
- 20 horses listed "1-20", each with a unique color and a condition from 1 to 100.
- "Generate" creates a 6-round schedule; each round draws 10 random horses; distances run 1200/1400/1600/1800/2000/2200 m.
- "Start" runs rounds one at a time; each round's results appear when it concludes; horses visibly move.
- Clean, scalable code "as if for a large-scale project".
- Bonus: unit, E2E and visual tests.
- Questions to the recruiter are encouraged.

Example UI (OCR of page 2), used as a functional reference only:
- A header with `GENERATE PROGRAM` and `START / PAUSE`.
- "Horse List (1-20)" with Name, Condition and Color.
- 10 numbered lanes with a `FINISH` line.
- "Program" and "Results" with one table per lap ("1ST Lap - 1200m", Position, Name).

Owner decisions:
- Commits: Conventional Commits.
- Tooling: official Vue toolchain, styled after Insider's shared config.
- Repository: public on GitHub, one PR per phase; every push and publish is confirmed first.
- UI: modern and polished rather than a copy of the example; fully responsive and accessible; frontend engineering standards throughout.
- Plan: this plan is committed for reviewers.

## 2. Verified research (2026-09-14) and how it is applied

| # | Finding (source) | Applied as |
|---|---|---|
| R1 | Insider One Engineering blog, "How We Keep Frontend Code Clean" (2026-02-03): Vue-first; "TypeScript is non-negotiable"; thin components with logic in composables; one owner per piece of state. Layout: feature code under `views/<Feature>/{components,composables}`, shared code in `components/ui`, `components/common`, `composables`, `stores`, `utils`. `<script setup>` order: imports, props/emits, composables/store, refs, computed, methods, lifecycle. Scoped styles only; ESLint + Prettier; Husky + lint-staged; every PR runs type-check, lint, unit tests and build; self-documenting names over comments | Structure, component template, CI gates |
| R2 | Vuex to Pinia migration guide (same blog, 2026-01-19) | Pinia |
| R3 | `@useinsider/ab-components`: Vite, Vitest + Vue Test Utils, Playwright `test:visual`; `@useinsider/guido`: commitlint config-conventional, husky, Stryker mutation tests, Playwright visual snapshots (npm) | Test stack, Stryker, commitlint |
| R4 | `@useinsider/eslint-config` 3.0.1 Vue rules: 4-space script and template indent, one attribute per line, `script[setup]` block first, PascalCase components, `sonarjs/cognitive-complexity` 10; README samples use semicolons and single quotes | Prettier and ESLint settings |
| R5 | "Software Engineer (AI Native)" posting (Lever, 2026-09-08): Claude Code first; agent output untrusted until reviewed; "fix the context, not the prompt"; skills, sub-agents, guardrails; AI review; AI-suggested packages verified; candidates explain what they delegated, kept, where the agent failed and how they caught it | AI workflow, AI log |
| R6 | `useinsider/go-pkg` AI-config standard (PR #66): `CLAUDE.md` importing `@.claude/rules/*.md`, `.claude/agents/code-reviewer.md`, `.claude/skills/*` (`disable-model-invocation: true`), PreToolUse secret-file blocker (exit 2), PostToolUse formatter | `.claude/` layout |
| R7 | Conventional Commits with scopes plus ticket keys (go-pkg, ReactNativeDemo) | Commit convention |
| R8 | Insider builds its own design system: atomic components styled through its own class structure ("How To 'Design' a Design System" I and II); company-wide decision that the design system is built in Vue (2026-02-24); CSS custom properties recommended for design systems; `<style scoped>` only (R1). Their Vue packages use Sass. GitHub code search finds no Tailwind in the org's public repos | In-house tokens and UI kit with scoped styles (4.1) |

Also verified:
- Claude Code: reads `CLAUDE.md` (the documented pattern is an `@AGENTS.md` import), supports path-scoped `.claude/rules` via `paths:`, and CLAUDE.md should stay under 200 lines.
- Stryker vitest-runner 10.0.0 kills nothing on Vitest 5 (stryker-js #6210 and fix PR #6214 open).
- The Playwright image `v1.63.0-noble` ships amd64 and arm64, and `ubuntu-24.04-arm` runners are free for public repos.
- `page.clock.fastForward` fires due timers once, while `runFor` ticks through them.
- Fontsource Archivo Variable exposes width and weight axes.
- Phosphor's horse icon is a chess-knight head.
- `@lhci/cli` was last published 2025-06, on Lighthouse 12.6.

## 3. Requirements baseline (formalized as EARS in Phase 0)

Test titles and commit footers reference these IDs.

- HORSE-01 The system shall maintain exactly 20 horses with ids 1 to 20.
- HORSE-02 Each horse shall have a unique name and a unique color (name and hex).
- HORSE-03 Each horse shall have an integer condition from 1 to 100.
- HORSE-04 When the app loads, the system shall generate the horses randomly and list Name, Condition and Color.
- PROG-01 When the user activates Generate Program, the system shall create 6 rounds.
- PROG-02 Round n shall have a distance of 1200 + 200 * (n - 1) meters.
- PROG-03 Each round shall contain 10 distinct horses drawn at random from the 20.
- PROG-04 When a program is generated, the system shall list every round (lap title, distance, Position = lane, Name) and clear previous results.
- RACE-01 When the user activates Start with a program ready, the system shall run the rounds sequentially, one at a time.
- RACE-02 While a round runs, each horse shall move along its lane in proportion to its simulated progress; the track shall show the lap title and current leader, and Program and the lap stepper shall mark the running round (`aria-current`).
- RACE-03 When the user activates Pause while running (intermission included), positions and timers shall freeze; Resume shall continue from the same state. The toggle reads Start, Pause or Resume.
- RACE-04 The finishing order shall come from the simulation: higher condition raises expected speed, randomness allows upsets.
- RACE-05 A long frame gap (hidden tab) or a viewport resize mid-race shall not skip, reorder or distort a round.
- RES-01 When a round finishes, the system shall append its results (Position = finishing place, Name, podium marker for the top 3) in round order, scroll the newest into view within its panel and announce the winner once.
- RES-02 When round 6 finishes, the system shall enter the finished state with horses held at the finish.
- CTRL-01 While no program exists or the race is finished, Start shall be disabled.
- CTRL-02 While the race is running, Generate Program shall be disabled; repeated activations shall be no-ops.
- UX-01 Before a program exists, Program, Results and the track shall show guidance instead of empty tables.
- UX-02 The theme shall follow `prefers-color-scheme`, be switchable, and persist the choice.
- UX-03 Below 768 px, Horses, Program and Results shall become tabs under the track, with the primary controls in a sticky bottom bar.
- NFR-01 WCAG 2.2 AA as detailed in 5.6; no axe violations in either theme, on desktop or mobile.
- NFR-02 Reflow at 320 px without horizontal scrolling; touch targets at least 24 px (primary controls 44 px).
- NFR-03 Deterministic under `?seed=<uint32>`; missing or invalid seed falls back to random.
- NFR-04 Animation uses transforms only; no console errors, uncaught errors or Vue warnings.
- NFR-05 Lighthouse on the production build: Performance >= 95, Accessibility 100, Best Practices >= 95, SEO >= 90.
- NFR-06 No third-party requests (fonts and icons bundled); CSP meta tag in production.

Glossary and assumptions (in the spec; drafted as recruiter questions the owner may send):
- Race = the 6-round program; round = "Lap" in the UI, as in the example.
- A1 "1 to 20" is the numbering of the list; fewer than 10 horses would make rule 5 impossible, so the total is fixed at 20.
- A2 Horses are generated once per page load; Generate Program redraws only the schedule.
- A3 Condition is constant across rounds.
- A4 Generate Program while paused discards the race in progress.
- A5 A round ends when the last horse finishes; a short intermission follows before the next round, none after round 6.

## 4. Technical decisions

| Area | Decision | Rationale |
|---|---|---|
| Runtime | `.nvmrc` 24, engines `^22.18.0 \|\| >=24.12.0`, npm with lockfile, `.npmrc` `save-exact=true` and `engine-strict=true` | Matches create-vue 3.23.0; zero setup friction |
| App | Vue 3.5.42, Vite 8.3.0, `@vitejs/plugin-vue` 6.0.9, TypeScript 6.0.3 strict, vue-tsc 3.3.11, `base: './'` | Vue 3.6 is RC; TypeScript 7 is outside typescript-eslint's `<6.1.0` peer range; relative base works on Pages |
| State | Pinia 4.0.3 setup stores with `@vue/devtools-api` 8.2.1 (required peer) | Brief, R2 |
| Design assets | `@fontsource-variable/archivo` 5.3.0 (OFL), `@phosphor-icons/vue` 2.2.1 (MIT) for UI icons, original SVG runner | Self-hosted, one type family, no third-party requests |
| UI | No router, component library, CSS framework or preprocessor: in-house design system (tokens, cascade layers, UI kit), scoped styles | See 4.1 |
| Unit and component | Vitest 4.1.11, `@vitest/coverage-v8` 4.1.11, `@vue/test-utils` 2.5.0, jsdom 30.0.1, `@pinia/testing` 2.0.1 | Vitest 5 blocked by Stryker #6210; 4.1.11 is what create-vue ships |
| Mutation | Stryker 10.0.0 with vitest-runner on `src/domain` only | R3; proves assertions, not just coverage |
| E2E, a11y, visual | Playwright 1.63.0 against `vite preview`, `page.clock` + `runFor`, `toHaveScreenshot` in the official image on arm64, `@axe-core/playwright` 4.13.0 | R3; Vitest screenshots still experimental |
| Lint | ESLint 10.10 flat config from create-vue: eslint-plugin-vue 10.11 `flat/recommended`, `@vue/eslint-config-typescript` 14.9 `recommendedTypeChecked`, oxlint 1.82 + eslint-plugin-oxlint 1.82, eslint-plugin-sonarjs 4.2.0 (cognitive complexity 10), `@vitest/eslint-plugin`, eslint-plugin-playwright; R1 and R4 rules (`vue/block-order`, `vue/define-macros-order`, PascalCase, `vue/no-unused-components`, `no-console` allowing warn and error, `@typescript-eslint/no-explicit-any`); `--max-warnings=0` | Owner decision, R1, R4 |
| CSS lint | Stylelint 17.15.0 with stylelint-config-standard 40.0.0, stylelint-config-recommended-vue 2.0.0, postcss-html 2.0.0, stylelint-config-recess-order 7.8.0 | CSS standards in SFCs and global styles |
| Format | Prettier 3.9.6 via `skip-formatting`: `tabWidth: 4`, `semi: true`, `singleQuote: true`, `trailingComma: 'es5'`, `singleAttributePerLine: true`, `printWidth: 100`; 2-space override for JSON, YAML, Markdown | R4 house style |
| Git | husky 9.1.7, lint-staged 17.5.1, commitlint 21.2.2: config-conventional, header, body and footer lines at most 72, scope list (`domain`, `stores`, `playback`, `ui`, `a11y`, `e2e`, `visual`, `ci`, `docs`, `ai`, `deps`, `config`), footer `Refs: HRG-<task>` | Owner decision, R7 |
| Not included | Vuex, vue-router, component libraries, Storybook/Chromatic, Tailwind, Sass, i18n, knip, Lighthouse CI (stale), animation or property-testing libraries | Listed under next steps where relevant |

Dependency rule: `npm view <pkg> version peerDependencies` before any install; nothing unverified enters the lockfile (R5).

### 4.1 Why no router, component library or Tailwind (recorded in ADR 0001)

- **vue-router:**
  - The app is a single screen with no addressable views.
  - The only URL state is `?seed`, read once with `URLSearchParams`.
  - A router would add a dependency, configuration and test surface with no user value.
  - `views/` already follows the page structure, so adding routes later (history, leaderboard) touches only `main.ts` and `App.vue`.
- **Component library:**
  - The brief explicitly evaluates "component structure, code organization", and a library would hide exactly that.
  - The UI needs six primitives. Only Tabs has complex behavior; it is built to the WAI-ARIA APG pattern and keyboard-tested.
  - A styled library's visual language fights the custom broadcast design and adds bundle weight against NFR-05.
  - Insider itself builds its own design system (R8).
  - If scope grew to comboboxes, date pickers or data grids, the next step would be a headless library (for example Reka UI), not a styled one.
- **Tailwind:**
  - Insider's documented standard is scoped styles plus custom-property tokens, with no Tailwind in its public code (R1, R8), so reviewers read familiar code.
  - The signature visuals are custom CSS in any case (turf stripes, checkered finish, grain, container queries, cascade layers, keyframes), where utilities would turn into arbitrary values.
  - Modern CSS covers what Tailwind historically solved, without a build plugin or class-sorting tooling: custom properties, nesting, `color-mix`, container queries, `@layer`, logical properties, `clamp()`.
  - Tailwind v4 is a valid industry choice; it is left out for alignment and design reasons, not capability.
- **Sass:** Insider's packages use it (R8), but native nesting and custom properties make it unnecessary here.

## 5. Architecture

### 5.1 Structure (R1 layout plus a pure domain layer)

```
src/
  main.ts                 bootstrap: Pinia, RNG provide, errorHandler, fonts, global styles
  App.vue                 renders RaceDashboardView
  domain/                 pure TypeScript rules; no Vue, Pinia or DOM (lint-enforced)
    random/               createRng (mulberry32), randomInt, sampleWithoutReplacement
    horse/                horse.types, horse.constants (name pool, 20 named silk colors), generateHorses
    race/                 race.types, race.constants, generateProgram, simulateRound, rankPlacements, progressAt, advancePlayback
    index.ts              public API
  stores/                 horses.ts (useHorsesStore), race.ts (useRaceStore)
  composables/            useRng, useAnimationFrame, useRacePlayback, useTheme, useMediaQuery, useAnnouncer
  components/ui/          BaseButton, BaseCard, BaseTable, BaseTabs, BaseBadge, SkipLink, LiveAnnouncer
  components/common/      HorseRunner (SVG), SilkChip, ConditionMeter, RoundCard, ThemeToggle
  views/RaceDashboard/    RaceDashboardView.vue, components/ (AppBar, LapStepper, RaceControls, HorseRoster, RaceTrack, RaceLane, ProgramPanel, ResultsPanel, MobileActionBar)
  utils/                  formatLapTitle, contrastRatio, readableTextColor, resolveSeed
  styles/                 layers.css, tokens.css (both themes), base.css, utilities.css
  test/                   setup (fails on console warn/error), createTestStores
e2e/                      fixtures (seed, clock, pageerror guard, axe), *.spec.ts, visual/*.spec.ts
scripts/                  check-traceability.mjs
docs/                     implementation-plan.md, specs/, adr/, ai-workflow.md, case-study-qa.md
```

Boundaries, enforced with ESLint `no-restricted-imports` and `no-restricted-globals`:
- `domain` imports nothing app-level and uses no DOM globals.
- Stores are used only by `RaceDashboardView.vue` and the composables it calls; every other component is props in, events out.
- `components/ui` never imports domain.
- Stores never import components or views.

Unit tests sit next to their source as `*.spec.ts`.

### 5.2 Contracts (approved in Phase 0, before implementation)

```ts
type HorseId = number
interface HorseColor { readonly name: string; readonly hex: string }
interface Horse { readonly id: HorseId; readonly name: string; readonly color: HorseColor; readonly condition: number }
interface Round { readonly number: number; readonly distance: number; readonly horseIds: readonly HorseId[] } // lane = index + 1
interface HorseRun { readonly horseId: HorseId; readonly lane: number; readonly checkpointsMs: readonly number[] } // finish = last checkpoint
interface RoundSimulation { readonly round: Round; readonly runs: readonly HorseRun[]; readonly durationMs: number }
interface RaceProgram { readonly rounds: readonly Round[]; readonly simulations: readonly RoundSimulation[] }
interface Placement { readonly position: number; readonly horseId: HorseId; readonly finishTimeMs: number }
interface RoundResult { readonly roundNumber: number; readonly distance: number; readonly placements: readonly Placement[] }
type RaceStatus = 'idle' | 'ready' | 'running' | 'paused' | 'finished'
interface PlaybackState { readonly roundIndex: number; readonly phase: 'racing' | 'intermission'; readonly elapsedMs: number }
interface PlaybackStep { readonly state: PlaybackState; readonly completedRoundIndexes: readonly number[]; readonly isFinished: boolean }
interface Rng { next(): number } // [0, 1)

createRng(seed: number): Rng
generateHorses(rng: Rng): Horse[]
generateProgram(horses: readonly Horse[], rng: Rng): RaceProgram
simulateRound(round: Round, horsesById: ReadonlyMap<HorseId, Horse>, rng: Rng): RoundSimulation
rankPlacements(simulation: RoundSimulation): Placement[]
progressAt(run: HorseRun, elapsedMs: number): number // 0..1
advancePlayback(state: PlaybackState, deltaMs: number, program: RaceProgram): PlaybackStep
```

### 5.3 Race simulation

- All six rounds are simulated when the program is generated, so randomness is consumed only there; results stay hidden until each round completes.
- Rounds split into 100 m segments. Segment speed = `BASE_SPEED * conditionFactor * form * jitter`: `conditionFactor = MIN_FACTOR + (1 - MIN_FACTOR) * condition / 100`, `form` drawn once per horse per round (creates upsets), `jitter` drawn per segment (creates lead changes).
- Cumulative segment times scaled by `PLAYBACK_SPEED` become `checkpointsMs`; `progressAt` interpolates, so pause and resume are exact.
- Placement order: finish time, then lane. Tunables live in `race.constants.ts`; target playback about 4-6 s for 1200 m and 7-10 s for 2200 m.
- Tests:
  - A stubbed RNG gives exact cases: no variance means condition order, and equal times fall back to lane.
  - A seeded Monte Carlo run (N >= 2000) checks documented upset-rate targets, with bounds at least 5 sigma wide.
  - Invariants: positions are a permutation of 1-10, and checkpoints strictly increase.

### 5.4 State ownership and game loop

- `useHorsesStore`: `horses` (shallowRef), `horsesById`, `generate()`.
- `useRaceStore`: `status`, `program` and `results` (shallowRef); getters `canGenerate`, `canStart`; actions `generateProgram()`, `start()`, `pause()`, `toggle()`, `completeRound(index)` (ordered, idempotent, finishes after round 6). No per-frame actions, so the Pinia devtools timeline stays readable.
- `advancePlayback` (pure) carries leftover time across racing, intermission and the next round, and reports completed rounds.
- `useRacePlayback` (called once by the view):
  - Owns `PlaybackState`.
  - Runs `useAnimationFrame` only while `status === 'running'` and clamps the frame delta to 100 ms.
  - Resets its last timestamp on every stop, so resume never jumps, and resets entirely on a new program.
  - Dispatches `completeRound` and exposes the active round, the leader and progress per horse.
- RNG: `app.provide(RNG_KEY, createRng(resolveSeed(location.search)))`; stores call `useRng()`; `createTestStores({ seed })` builds an app with Pinia and the RNG for store tests.
- App-level UI state stays out of Pinia: theme in `useTheme` (matchMedia + localStorage), layout mode in `useMediaQuery`, announcements in `useAnnouncer`.

### 5.5 Design system and UX: "Race Night" broadcast

- **Concept:** live TV race graphics. A floodlit-night dark theme is the signature look; a "Day Meet" light theme comes from the same tokens. The default follows the system; the toggle persists.
- **Signature element: the track as hero.**
  - Turf with mowing stripes, white rails, a start gate and a checkered finish.
  - Silk-colored jockeys with number bibs ride an original SVG horse.
  - A lower-third banner shows the lap (for example "LAP 3/6 - 1600 M") and the current leader.
  - A brief finish-line photo flash marks each winner.
- **Typography:** Archivo Variable only. Condensed heavy width for display text, lap titles and numbers; normal width for body text; tabular numerals for conditions, positions and times; fluid type scale with `clamp()`.
- **Color:**
  - Base: ink navy with subtle floodlight gradients and a static grain texture; turf green track.
  - Accent: a single sharp chartreuse for the primary action and live state.
  - Podium: gold, silver and bronze markers, always paired with text and icons.
  - Silks: 20 named racing-silk colors, with bib text color computed for at least 4.5:1 contrast.
  - Every token pair meets WCAG 2.2 AA in both themes.
- **Layout, mobile first:**
  - 1280 px and up: broadcast bar (brand, lap stepper, controls, theme toggle), then roster rail, hero track, Program and Results rail.
  - 768 to 1279 px: bar, full-width track, then roster beside Program and Results.
  - Below 768 px: compact bar with a scrollable lap stepper, full-width track (bibs visible, names in accessible labels), APG tabs for Horses, Program and Results, sticky bottom action bar with safe-area insets.
- **Components:**
  - Roster as a styled table: silk chip, name, condition meter with the number.
  - Program and Results as lap racecards: lap, distance, Upcoming/Live/Finished badge, captioned table.
  - Guidance empty states; Phosphor icons for controls.
- **Motion:**
  - One staggered reveal on first load; results cards enter with `TransitionGroup`; lap stepper fill; gallop bob.
  - `prefers-reduced-motion` removes everything except horse movement; nothing flashes more than 3 times per second.
  - CSS animations are finite or cancelable, so Playwright screenshots settle deterministically.
- **Design gate:** before any UI code, a design canvas (private Artifact through the `design` skill, after confirmation) with desktop, tablet and mobile artboards in both themes for idle, running and finished states. Tokens are extracted from the approved canvas.

### 5.6 Frontend standards (enforced by lint, tests or review)

- **Semantic HTML first:** `header`, `main`, labeled `section`s, one `h1` with ordered headings, native buttons, tables with `caption` and `scope`. ARIA only as specified by WAI-ARIA APG: tabs, a single polite live region, `aria-pressed` for the theme toggle, `aria-current` for the running lap.
- **WCAG 2.2 AA:**
  - Contrast: text 4.5:1; UI components and focus indicators 3:1.
  - Focus: `:focus-visible` rings never hidden under the sticky bar (`scroll-padding`).
  - Keyboard: skip link and full keyboard operation.
  - Announcements: status changes and each lap's winner, never per frame.
  - Track: accessible name and text summary; decorative runners hidden from assistive technology.
  - Display: `forced-colors` support, text resizable to 200%, `lang="en"`.
- **CSS architecture:**
  - Cascade layers (`reset, tokens, base, layout, components, utilities`).
  - Custom-property tokens: color, type, a 4 px spacing scale, radius, elevation, z-index, motion.
  - Logical properties and container queries for component responsiveness; hover styles only under `@media (hover: hover)`.
  - No `!important`; values come from tokens.
- **Vue conventions:**
  - Vue style guide priorities A to C via `flat/recommended`.
  - `Base*` prefix and multi-word PascalCase names.
  - Typed `defineProps` and `defineEmits`.
  - Stable `v-for` keys, computed values over watchers, `shallowRef` for immutable data.
- **Performance:** transform-only animation, no layout reads per frame, self-hosted woff2 with `font-display: swap`, a preloaded display face with a metric-matched fallback, Vite's Baseline Widely Available build target.
- **Security and metadata:** CSP meta tag injected only into production builds; no inline scripts; `<title>`, description, `theme-color` per scheme, SVG favicon.

## 6. AI-assisted workflow

Repository files (R6 layout; `AGENTS.md` is the single source for every agent):
- `AGENTS.md` (under 100 lines):
  - Stack and versions, copy-paste commands, architecture map and boundaries.
  - Off-limits items: `.env*`, editing the lockfile by hand, screenshot baselines, `dist/`; no dependency without approval and `npm view`.
  - Definition of done and commit rules.
  - Points to `docs/specs/` as the source of truth; `docs/implementation-plan.md` is a historical record and is not loaded into agent context.
- `CLAUDE.md`: `@AGENTS.md`, the automations list and compact instructions (preserve phase, task ID, failing tests, decisions with rationale).
- `.claude/rules/` with `paths:`:
  - `domain.md`
  - `vue-components.md`: R1 template order, props in and events out, APG patterns
  - `styles.md`: tokens only, layers, logical properties, focus, reduced motion, contrast
  - `stores.md`
  - `testing.md`: requirement ID in the test title, one behavior per test, meaningful assertions, seed and clock
- `.claude/agents/test-author.md` writes failing tests from EARS criteria. Its own PreToolUse hook allows edits only to test files, so tests are never written by the prompt that writes the code.
- `.claude/agents/code-reviewer.md` is read-only and reviews the diff against spec, rules and assertion quality.
- `.claude/skills/verify/` runs the gates and reports evidence; `.claude/skills/implement-task/` (`disable-model-invocation: true`) runs the task loop.
- `.claude/hooks/`, written as Node scripts:
  - `block-sensitive-files.mjs` (PreToolUse): exits 2 for `.env*`, keys, the lockfile and snapshot baselines.
  - `format-on-write.mjs` (PostToolUse): runs Prettier, ESLint and Stylelint fixes on the edited file and surfaces remaining errors with exit 2.
- `.claude/settings.json`: hooks, `permissions.deny` for reading `.env*`.
- `.github/pull_request_template.md`: requirement IDs, verification evidence, screenshots, AI usage notes.
- `docs/ai-workflow.md`: log written during each task (delegated, kept, rejected suggestion, failure caught and how, rule added). It opens with the planning log: research sources, and which independent-review findings were accepted or rejected, and why.

Task loop for each `docs/specs/tasks.md` entry (`HRG-<n>`):
1. Scope: one task, its requirement IDs, files it may touch.
2. Red: `test-author` writes failing tests; the owner reviews the assertions.
3. Green: implement within the rules; hooks format and lint every write.
4. Verify: `/verify` evidence.
5. Review: `code-reviewer`, then the owner; recurring findings become rules.
6. Commit with `Refs: HRG-<n>`, update `tasks.md` and `ai-workflow.md`; fresh session at phase boundaries.

## 7. Phases

Each phase is one branch and one PR with CI green; pushes happen only after explicit confirmation.

**Phase 0: Baseline, plan and spec**
- Scaffold from the parent directory; the target must not exist and `--force` is never used:
  - `npm create vue@3.23.0 horse-racing-game -- --ts --pinia --vitest --playwright --eslint --prettier --bare`
  - `git init -b main`
  - Commit the untouched scaffold (`chore: scaffold project with create-vue 3.23.0`).
- Branch `docs/spec`:
  - First commit: `docs/implementation-plan.md`, this plan with machine-specific details removed and a status header. Later deviations go into ADRs and `tasks.md`; the plan is never rewritten.
  - `docs/specs/requirements.md`: section 3 as EARS, glossary, assumptions, recruiter questions, state and event table.
  - `docs/specs/design.md`: sections 5.1 to 5.6, mermaid state diagram, constants, empty and intermission states.
  - `docs/specs/tasks.md`.
  - `docs/ai-workflow.md` with the planning log.
- ADRs (MADR, short): 0001 architecture, state ownership and the 4.1 decisions; 0002 simulation and determinism; 0003 testing and toolchain pins.
- Create the public GitHub repo and push after confirmation (confirm the owning account then).
- Gate: owner approves requirements, assumptions and contracts.

**Phase 1: Walking skeleton and guardrails**
- Install and pin section 4 versions; `.npmrc`, `.nvmrc`, `.editorconfig`, `.gitattributes`.
- Configs:
  - tsconfig strictness.
  - `eslint.config.ts` with boundaries, `.oxlintrc.json`, `stylelint.config.mjs`, Prettier.
  - `vite.config.ts` with production-only CSP injection.
  - `vitest.config.ts`:
    - `coverage.include: ['src/**/*.{ts,vue}']`
    - Thresholds: 90 global, 85 branches, `'src/domain/**': { 100: true }`
    - A setup file that fails on console warn/error
  - `playwright.config.ts`:
    - `vite preview` web server everywhere, headless.
    - Projects: `e2e-chromium` (full), `e2e-firefox` and `e2e-webkit` (tagged smoke), `visual` (chromium, `reducedMotion: 'reduce'`, dark and light color schemes).
    - An auto-fixture that fails on `pageerror` and console errors.
- husky: pre-commit lint-staged, commit-msg commitlint, pre-push type-check and unit tests.
- Scripts: `verify`, `lint:style`, `test:e2e`, `test:visual:docker`, `test:visual:update`, `test:mutation`.
- AI files from section 6; each hook dry-run.
- Minimal app shell with one unit test, one E2E smoke test and one visual baseline to prove every pipeline.
- CI:
  - `ci.yml` jobs:
    - `quality`: npm ci, lint, style lint, format check, type-check, unit with coverage, build, traceability report, `npm audit --omit=dev --audit-level=high`.
    - `e2e`: Playwright image.
    - `visual`: `ubuntu-24.04-arm`, same image, `workflow_dispatch` input to regenerate baselines as an artifact.
  - `deploy.yml`: GitHub Pages on `main`.
  - Least-privilege permissions and concurrency groups throughout.
- Gate: all CI jobs green; a bad commit message and a `.env` edit are shown to be blocked.

**Phase 2: Domain (test-first)**
- Units, with the requirements each covers:
  - random.
  - generateHorses: HORSE-01 to 03, silk palette contrast.
  - generateProgram with simulations: PROG-01 to 03.
  - simulateRound, rankPlacements, progressAt: RACE-04.
  - advancePlayback: RACE-01, RACE-03, RACE-05 logic, RES-02.
- `stryker.config.mjs` (`src/domain`, break 80) and `mutation.yml` (PRs touching `src/domain`, plus manual dispatch).
- Gate: 100% domain coverage; mutation score at least 80 (target 90); a deliberately planted mutant is reported Killed; reviewer pass.

**Phase 3: Stores and playback**
- Stores: useHorsesStore (HORSE-04); useRaceStore (PROG-04, RES-01, CTRL-01, CTRL-02).
- Composables: useRng, useAnimationFrame, useRacePlayback (tested with Vitest fake timers); useTheme, useMediaQuery, useAnnouncer.
- Gate: a table-driven test of every state and event pair, no-ops included; pause during intermission, generate while paused, a 5 s frame gap, resume without a jump.

**Phase 4a: Design system and presentational components**
- Design canvas approval (section 5.5 gate).
- Tokens for both themes, cascade layers, fonts, grain and turf textures.
- UI kit (BaseButton, BaseCard, BaseTable, BaseTabs, BaseBadge, SkipLink, LiveAnnouncer).
- Common components (HorseRunner, SilkChip, ConditionMeter, RoundCard, ThemeToggle).
- View components with props and emits only.
- Component tests:
  - UX-01 empty states.
  - APG tab keyboard behavior (arrows, Home, End).
  - Toggle semantics and table semantics.
  - Contrast of all 20 silk colors with their bib text.
- Gate: component tests green with zero Vue warnings; Stylelint clean; parity with the approved canvas checked in the Browser pane.

**Phase 4b: Wiring and behavior**
- E2E specs first (red):
  - Flows: initial list, generate, full 6-round run on chromium with `runFor`, pause and resume, generate while paused, control states and double activation, resize mid-race.
  - Access and modes: keyboard-only flow (skip link, controls, tabs), theme persistence, reduced motion, compact layout below 768 px.
  - Browsers and audits: axe on desktop and mobile in both themes; a smoke subset on firefox and webkit.
- Wiring: RaceDashboardView, announcer messages, responsive layout switch, sticky action bar with `scroll-padding`, errorHandler, seed resolution, metadata and favicon.
- Traceability check switched to enforcing.
- Gate: E2E and axe green; Browser-pane walkthrough at desktop, tablet and mobile in both themes, including keyboard-only use; clean console.

**Phase 5: Visual regression**
- Chromium baselines:
  - Dark theme: initial, program ready, mid-race paused (seed, `runFor`, Pause) and finished, at desktop and mobile (8).
  - Light theme: initial and finished at desktop (2).
- `npm run test:visual:docker` runs the arm64 image natively on Apple Silicon with `node_modules` in a Docker volume, same as CI.
- Gate: visual job green; baseline update procedure documented.

**Phase 6: Documentation and delivery**
- README: overview, demo link, screenshots in both themes, quick start, scripts, architecture diagram, design system summary, rules and assumptions, testing strategy and gates, accessibility statement, planning trail (plan, specs, ADRs, AI log), trade-offs and next steps.
- `docs/case-study-qa.md` answered from the real code with file and line links; `docs/ai-workflow.md` finalized.
- Lighthouse audit of the production build (NFR-05) and a VoiceOver smoke pass, both recorded in the PR.
- Final `code-reviewer` pass, `/code-review`, `/security-review`; findings fixed or documented.
- After confirmation: Pages demo live, CodeQL default setup and Dependabot alerts offered.
- Gate: fresh clone passes `npm ci && npx playwright install --with-deps && npm run verify && npm run test:e2e`; docs match behavior.

## 8. Verification

- `npm run verify`: lint, style lint, format check, type-check, unit tests with coverage thresholds, build, traceability (every requirement ID in at least one test title).
- `npm run test:e2e` (behavior, keyboard, axe in both themes), `npm run test:visual:docker`, `npm run test:mutation`.
- Browser-pane walkthrough on `vite preview`:
  - Flows: generate, start, pause and resume, generate while paused, all 6 rounds, resize.
  - Coverage: desktop, tablet and mobile; both themes; keyboard only.
  - Evidence: clean console; screenshots in the PR.
- Delivery checks: Lighthouse and VoiceOver results recorded; CI green on every PR; deployed demo smoke-tested; fresh-clone check from Phase 6.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Time-dependent flakiness | Pure `advancePlayback`; seed plus `page.clock.install()` before navigation and `runFor` only |
| Screenshot drift | Bundled font; baselines and CI on the same arm64 Playwright image; CI regeneration job; small `maxDiffPixelRatio` |
| Stryker and Vitest 5 incompatibility | Vitest 4.1.11 pinned; planted-mutant check; upgrade after stryker-js #6214 ships |
| Bold visuals hurting readability or contrast | Contrast-checked token pairs, axe in both themes, design canvas approval before code |
| Hand-drawn SVG runner quality | Approved in the design canvas; single reusable component |
| Font swap layout shift | Preloaded display face, metric-matched fallback, Lighthouse CLS check |
| Simulation too predictable or too random | Form factor plus jitter; Monte Carlo targets with wide bounds |
| Pinia 4 ESM-only, devtools peer, `inject` outside an app | Explicit peer install; `useRng` throws; `createTestStores` helper |
| Vue warnings hidden by production builds | Unit and component tests fail on console warnings; E2E fails on page errors |
| Plan drifting from reality | The plan copy is a dated historical record; deviations live in ADRs and `tasks.md` |
| Agent-invented APIs or packages | `npm view` rule, official docs, test-author/reviewer split, owner review of assertions |
| Scope creep | "Not included" list; any new tool needs an ADR |
