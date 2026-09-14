# Task Breakdown

Every task lands through the pull request of its phase, and its commits end with `Refs: HRG-<n>`. Status: `[x]` done, `[ ]` open.

## Phase 0: Baseline, plan and spec

Branch `docs/spec`.

| ID     | Task                                                                                   | Requirements | Verification                                        | Status |
| ------ | -------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------- | ------ |
| HRG-01 | Scaffold with create-vue 3.23.0 and commit the output untouched                        | ADR 0003     | Baseline commit on `main`                           | [x]    |
| HRG-02 | Commit the approved implementation plan                                                |              | [implementation-plan.md](../implementation-plan.md) | [x]    |
| HRG-03 | Requirements specification: EARS criteria, glossary, lifecycle table, author decisions | All          | Owner approval                                      | [x]    |
| HRG-04 | Design specification: architecture, contracts, simulation, UX, standards               | All          | Owner approval                                      | [x]    |
| HRG-05 | Task breakdown                                                                         | All          | This file                                           | [x]    |
| HRG-06 | ADRs 0001 to 0003                                                                      |              | Owner approval                                      | [x]    |
| HRG-07 | AI workflow log: planning session                                                      |              | [ai-workflow.md](../ai-workflow.md)                 | [x]    |
| HRG-08 | Create the public repository and push                                                  |              | Remote `main` and the Phase 0 pull request          | [x]    |

## Phase 1: Walking skeleton and guardrails

Branch `chore/walking-skeleton`.

| ID     | Task                                                                                  | Requirements   | Verification                                                                 | Status |
| ------ | ------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- | ------ |
| HRG-10 | Align and pin dependencies; `.npmrc`, `.nvmrc`, `.editorconfig`                       | ADR 0003       | `npm ci` succeeds on Node 22 and 24                                          | [x]    |
| HRG-11 | TypeScript strictness and project references for colocated specs                      | NFR-04         | `npm run type-check`                                                         | [x]    |
| HRG-12 | ESLint, Oxlint, Stylelint and Prettier with house style and import boundaries         | ADR 0001       | `npm run lint`, `npm run lint:style`, deliberate boundary violation rejected | [x]    |
| HRG-13 | Vitest: jsdom, coverage include and thresholds, console guard                         | NFR-04         | `npm run test:unit`                                                          | [x]    |
| HRG-14 | Playwright: preview server, projects, page-error and axe fixtures                     | NFR-01, NFR-04 | `npm run test:e2e`                                                           | [x]    |
| HRG-15 | husky, lint-staged and commitlint                                                     |                | A non-conventional commit message is rejected                                | [x]    |
| HRG-16 | Agent configuration: `AGENTS.md`, `CLAUDE.md`, rules, agents, skills, hooks, settings |                | Hook dry runs block a `.env` edit                                            | [x]    |
| HRG-17 | App shell with smoke unit, E2E and visual tests                                       |                | All CI jobs green                                                            | [x]    |
| HRG-18 | Traceability script in report mode                                                    | All            | `npm run verify`                                                             | [x]    |
| HRG-19 | CI workflows (quality, e2e, visual, deploy) and pull request template                 |                | Green pull request checks                                                    | [x]    |

## Phase 2: Domain

Branch `feat/domain`. Tests are written before implementation.

| ID     | Task                                                   | Requirements                      | Tests                                                                   | Status |
| ------ | ------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------- | ------ |
| HRG-20 | Seeded RNG and sampling helpers                        | NFR-03                            | `src/domain/random/*.spec.ts`                                           | [x]    |
| HRG-21 | Horse generation and silk palette                      | HORSE-01, HORSE-02, HORSE-03      | `src/domain/horse/generateHorses.spec.ts`                               | [ ]    |
| HRG-22 | Program generation with simulations                    | PROG-01, PROG-02, PROG-03         | `src/domain/race/generateProgram.spec.ts`                               | [ ]    |
| HRG-23 | Round simulation, placements, progress and calibration | RACE-04, RES-01                   | `simulateRound.spec.ts`, `rankPlacements.spec.ts`, `progressAt.spec.ts` | [ ]    |
| HRG-24 | Playback reducer                                       | RACE-01, RACE-03, RACE-05, RES-02 | `src/domain/race/advancePlayback.spec.ts`                               | [ ]    |
| HRG-25 | Stryker configuration and mutation workflow            |                                   | Planted mutant reported Killed; score of at least 80                    | [ ]    |

## Phase 3: Stores and playback

Branch `feat/state`.

| ID     | Task                                                               | Requirements                                        | Tests                                                               | Status |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| HRG-30 | Horses store                                                       | HORSE-04                                            | `src/stores/horses.spec.ts`                                         | [ ]    |
| HRG-31 | Race store lifecycle, including every no-op of the lifecycle table | HORSE-04, PROG-04, RES-01, RES-02, CTRL-01, CTRL-02 | `src/stores/race.spec.ts`                                           | [ ]    |
| HRG-32 | RNG injection, seed resolution and test store helper               | NFR-03                                              | `src/composables/useRng.spec.ts`, `src/utils/resolveSeed.spec.ts`   | [ ]    |
| HRG-33 | Animation frame and race playback composables                      | RACE-01, RACE-02, RACE-03, RACE-05                  | `useAnimationFrame.spec.ts`, `useRacePlayback.spec.ts`              | [ ]    |
| HRG-34 | Theme, media query and announcer composables                       | UX-02, UX-03, NFR-01                                | `useTheme.spec.ts`, `useMediaQuery.spec.ts`, `useAnnouncer.spec.ts` | [ ]    |

## Phase 4a: Design system and presentational components

Branch `feat/design-system`.

| ID     | Task                                                                                  | Requirements                           | Tests                                          | Status |
| ------ | ------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------- | ------ |
| HRG-40 | Design canvas for desktop, tablet and mobile in both themes; owner approval           | UX-01, UX-02, UX-03, NFR-01            | Owner approval                                 | [ ]    |
| HRG-41 | Tokens, cascade layers, fonts and textures                                            | NFR-01, NFR-05, NFR-06                 | Stylelint; contrast unit tests                 | [ ]    |
| HRG-42 | UI kit: BaseButton, BaseCard, BaseTable, BaseTabs, BaseBadge, SkipLink, LiveAnnouncer | NFR-01, NFR-02                         | `src/components/ui/*.spec.ts`                  | [ ]    |
| HRG-43 | Common components: HorseRunner, SilkChip, ConditionMeter, RoundCard, ThemeToggle      | HORSE-02, RES-01, UX-02, NFR-01        | `src/components/common/*.spec.ts`              | [ ]    |
| HRG-44 | Dashboard view components                                                             | PROG-04, RACE-02, RES-01, UX-01, UX-03 | `src/views/RaceDashboard/components/*.spec.ts` | [ ]    |

## Phase 4b: Wiring and behavior

Branch `feat/race-dashboard`.

| ID     | Task                                                        | Requirements                                                                       | Tests                       | Status |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------- | ------ |
| HRG-50 | End-to-end behavior specs, written failing first            | HORSE-04, PROG-01 to PROG-04, RACE-01 to RACE-05, RES-01, RES-02, CTRL-01, CTRL-02 | `e2e/*.spec.ts`             | [ ]    |
| HRG-51 | View wiring and responsive layout                           | RACE-02, UX-03                                                                     | `e2e/layout.spec.ts`        | [ ]    |
| HRG-52 | Accessibility: keyboard flow, axe, reduced motion, themes   | NFR-01, NFR-02, UX-02                                                              | `e2e/accessibility.spec.ts` | [ ]    |
| HRG-53 | Production hardening: CSP, metadata, favicon, error handler | NFR-04, NFR-06                                                                     | `e2e/production.spec.ts`    | [ ]    |
| HRG-54 | Traceability check switched to enforcing                    | All                                                                                | `npm run verify`            | [ ]    |

## Phase 5: Visual regression

Branch `test/visual-regression`.

| ID     | Task                                              | Requirements                         | Tests                  | Status |
| ------ | ------------------------------------------------- | ------------------------------------ | ---------------------- | ------ |
| HRG-60 | Visual specs and 10 baselines                     | RACE-02, RES-01, UX-01, UX-02, UX-03 | `e2e/visual/*.spec.ts` | [ ]    |
| HRG-61 | Visual CI hardening and baseline update procedure |                                      | CI visual job          | [ ]    |

## Phase 6: Documentation and delivery

Branch `docs/delivery`.

| ID     | Task                                        | Requirements   | Verification                 | Status |
| ------ | ------------------------------------------- | -------------- | ---------------------------- | ------ |
| HRG-70 | README                                      |                | Fresh-clone check            | [ ]    |
| HRG-71 | Case study questions and answers            |                | `docs/case-study-qa.md`      | [ ]    |
| HRG-72 | Lighthouse and VoiceOver audit              | NFR-01, NFR-05 | Recorded results             | [ ]    |
| HRG-73 | Final code and security review              | All            | Findings fixed or documented | [ ]    |
| HRG-74 | Release: Pages demo and repository settings | NFR-06         | Demo smoke test              | [ ]    |
