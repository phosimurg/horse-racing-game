# Case study questions and answers

Answers to the Insider One "Software Developer Assessment Project" brief, with pointers into the code and the specifications.

## 1. Does the project meet the brief?

| Brief item                             | Status | Where                                                                                                               |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| 1. Technology: Vue                     | Yes    | Vue 3.5 with the composition API and `<script setup>`; see [ADR 0001](adr/0001-architecture-and-state-ownership.md) |
| 2. Generate horse list                 | Yes    | `src/domain/horse/generateHorses.ts`, drawn on load and on every new program                                        |
| 3. Generate race schedule of 6 rounds  | Yes    | `src/domain/race/generateProgram.ts`, behind the Generate Program button                                            |
| 4. Start the race, one round at a time | Yes    | `src/stores/race.ts` with `src/composables/useRacePlayback.ts`; rounds run in order with an intermission            |
| 5. Display results as each race ends   | Yes    | `src/views/RaceDashboard/components/ResultsPanel.vue`, appended lap by lap                                          |
| 6. Animated horse movement             | Yes    | `src/components/common/HorseRunner.vue`, CSS transforms driven by a `--progress` custom property                    |
| 7. Coding style for a large project    | Yes    | Layered architecture with enforced import boundaries; see [design.md](specs/design.md) section 2                    |
| Rule 1: 20 horses                      | Yes    | `HORSE_COUNT = 20` in `src/domain/horse/horse.constants.ts`                                                         |
| Rule 2: unique color per horse         | Yes    | 20 named silk colors, one per horse, each with a contrast-checked bib text color                                    |
| Rule 3: condition 1 to 100             | Yes    | `CONDITION_MIN = 1`, `CONDITION_MAX = 100`                                                                          |
| Rule 4: 6 rounds per race              | Yes    | `ROUND_DISTANCES_M` has six entries                                                                                 |
| Rule 5: 10 random horses per round     | Yes    | `HORSES_PER_ROUND = 10`, sampled without replacement per round                                                      |
| Rule 6: round distances 1200 to 2200   | Yes    | `[1200, 1400, 1600, 1800, 2000, 2200]`                                                                              |
| Technical: Vuex or Pinia               | Yes    | Pinia setup stores in `src/stores`                                                                                  |
| Technical: component-based design      | Yes    | `components/ui`, `components/common` and view components                                                            |
| Bonus: unit tests                      | Yes    | Vitest, 364 tests, 100% coverage of `src/domain` plus mutation testing                                              |
| Bonus: end-to-end tests                | Yes    | Playwright across Chromium, Firefox and WebKit, with axe accessibility checks                                       |
| Bonus: visual tests                    | Yes    | 10 Playwright screenshot baselines in a pinned Docker image                                                         |

Every requirement also carries an ID in [requirements.md](specs/requirements.md), and `npm run traceability` fails the build if an ID has no test.

## 2. How is the state organized, and why?

The race lifecycle lives in two Pinia stores, and per-frame values do not.

- `stores/horses.ts` owns the roster.
- `stores/race.ts` owns the program, the status (`idle`, `ready`, `running`, `paused`, `finished`) and the published results. It changes only on a user action or at a round boundary.
- `composables/useRacePlayback.ts` owns the clock, the current progress of each horse and the leader. These change up to 60 times per second.

Keeping the animation frame out of the store keeps devtools readable, store tests synchronous, and re-renders limited to the track. The lifecycle table in [requirements.md](specs/requirements.md) section 6 defines every transition, including the no-ops, and the store tests assert each cell.

## 3. Why compute the race before animating it?

`simulateRound` produces the finishing order and per-segment checkpoints up front; playback interpolates between checkpoints. This means:

- the result never depends on frame timing, a slow tab or a resize;
- a paused race resumes exactly where it stopped;
- tests can assert placements without running an animation;
- the simulation could move to a server without touching the view layer.

Condition dominates speed, with a small random form and per-segment jitter, so a horse with a much better condition usually wins but upsets between close horses happen. See [ADR 0002](adr/0002-race-simulation-and-determinism.md).

## 4. How is the animation kept smooth?

One `requestAnimationFrame` loop updates a `--progress` custom property per lane, and the runners move with `transform` only, so no layout or paint work happens per frame. Frame deltas are clamped, which stops a background tab from teleporting the horses. Under `prefers-reduced-motion` the gallop stops while the horses still move along their lanes.

## 5. How is randomness made testable?

`createRng` is a seeded mulberry32 generator injected through Vue's provide and inject. The app resolves a seed from `?seed=<uint32>` in the URL or falls back to a random one. Tests and screenshots pass a fixed seed, so a run is reproducible; the visual tests also install Playwright's clock before navigation and advance it only with `runFor`.

## 6. What does the testing strategy cover?

Tests are written before the implementation, and each test title starts with the requirement ID it verifies.

- Domain rules are covered by unit and property tests at 100% coverage, with Stryker mutation testing to prove the assertions can fail.
- Stores and composables are tested with fake timers.
- Components and the dashboard view are tested with Vue Test Utils, and any Vue warning fails the run.
- Playwright covers the full race flow, layout, accessibility, production hardening and 10 visual baselines.

## 7. How is accessibility handled?

The target is WCAG 2.2 AA: semantic HTML first, a single race control with a clear name, `aria-current` on the running lap, results announced once through a polite live region, visible focus styles, keyboard-reachable scroll regions, and a color contrast of at least 4.5:1 for text in both themes. axe runs in CI over both themes on desktop and mobile viewports. Podium places never rely on color alone.

## 8. What would come next?

- Server-authoritative races: the domain has no browser dependencies, so it can run on a server and stream a program to clients.
- More horses, rounds or distances: counts and distances are validated constants and the track renders lanes from data.
- Additional screens: adding a router touches only `main.ts` and `App.vue`.
- Localization: user-facing copy lives in the view layer and could move to message catalogs.

## 9. How was AI used?

The project was built with Claude Code in a spec-driven loop: requirements and design first, then failing tests, then implementation, with a review agent at the end of each phase. [ai-workflow.md](ai-workflow.md) records what the agent got wrong, how it was caught and which guardrails were added, phase by phase.
