# ADR 0003: Testing strategy and toolchain

- Status: Accepted
- Date: 2026-09-14
- Related: [Design section 11](../specs/design.md#11-testing-strategy), NFR-01, NFR-03, NFR-04

## Context and problem statement

The brief lists unit, end-to-end and visual tests as a bonus. This project treats them as gates: an AI coding agent writes much of the code, so tests must prove behavior rather than merely execute it.

The toolchain must be current, officially supported and mutually compatible as of 2026-09-14. Every choice must be reproducible on a fresh clone and in CI.

## Decision drivers

- Tests with meaningful assertions, verified independently of coverage numbers.
- Determinism for time-based animation and screenshots.
- Alignment with Insider One's public tooling: Vitest, Vue Test Utils, Playwright visual tests, Stryker and commitlint.
- Versions verified against the npm registry, never assumed.

## Decision outcome

### Test layers

| Level                          | Tool                                                             | Scope                              | Gate                                                  |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| Domain unit and property tests | Vitest                                                           | `src/domain`                       | 100% coverage                                         |
| Mutation tests                 | Stryker                                                          | `src/domain`                       | Score of at least 80; a planted mutant must be killed |
| Store and composable tests     | Vitest with fake timers                                          | `src/stores`, `src/composables`    | Global coverage thresholds (90, branches 85)          |
| Component tests                | Vitest and Vue Test Utils                                        | Components and view components     | Zero Vue warnings                                     |
| End-to-end tests               | Playwright: chromium full suite, firefox and webkit smoke subset | User flows on the production build | Green                                                 |
| Accessibility tests            | `@axe-core/playwright` and keyboard specs                        | Both themes, desktop and mobile    | No violations                                         |
| Visual regression              | Playwright `toHaveScreenshot`                                    | 10 baselines                       | No diff beyond tolerance                              |
| Traceability                   | `scripts/check-traceability.mjs`                                 | Requirement IDs in test titles     | Every ID covered                                      |

### Determinism

- **Randomness:** end-to-end tests pass `?seed=`, and unit tests use fixed seeds or a stubbed RNG.
- **Time:**
  - Stores never touch timers, and composables are tested with Vitest fake timers.
  - Playwright installs `page.clock` before navigation and advances time only with `runFor`. The documentation says `fastForward` fires due timers once, which would stall an animation-frame loop.
- **Screenshots:** always taken in the official image `mcr.microsoft.com/playwright:v1.63.0-noble` on arm64, both on Apple Silicon and on GitHub's `ubuntu-24.04-arm` runners. The font is bundled, `reducedMotion` is `'reduce'` and animations are disabled.
- **Runtime noise:** unit and component tests fail on any `console.warn` or `console.error`, and end-to-end tests fail on page errors.

### Toolchain pins

| Tool              | Version                                                  | Reason                                                                                                                                  |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Vue               | 3.5.42                                                   | Latest stable; 3.6 is a release candidate                                                                                               |
| TypeScript        | 6.0.3                                                    | typescript-eslint 8.70 supports TypeScript below 6.1; TypeScript 7 is not supported yet                                                 |
| Vitest            | 4.1.11                                                   | Stryker's vitest-runner 10.0.0 matches no tests on Vitest 5, so every mutant survives (stryker-js #6210, fix pending in #6214)          |
| Playwright        | 1.63.0                                                   | Stable screenshot assertions; Vitest's `toMatchScreenshot` is still experimental                                                        |
| Stryker           | 10.0.0                                                   | Mutation testing for `src/domain`                                                                                                       |
| ESLint and Oxlint | 10.10 and 1.82                                           | eslint-plugin-oxlint 1.82 declares a peer dependency on oxlint 1.82                                                                     |
| Node.js           | `^22.22.2`, `^24.15.0` or `>=26.0.0`; CI uses 24         | The current releases of jsdom, npm-run-all2 and lint-staged, and nopt and abbrev pulled in by Vue Test Utils, require these patch lines |
| npm               | 11 for dependency changes; `npm ci` works with 10 and 11 | Without a lockfile, npm 10.9 crashes while resolving the Vitest 4 peer set (npm/cli#9787)                                               |

### Not adopted

- **Vitest 5:** blocked by the Stryker incompatibility above.
- **Storybook with Chromatic:** the components have no second consumer, and Chromatic requires an external account.
- **Lighthouse CI:** `@lhci/cli` was last published in June 2025 and still uses Lighthouse 12.6. Audits are run manually and recorded instead (NFR-05).
- **knip:** at this scale, lint rules and review prevent dead code.

## Consequences

- Good: mutation testing proves that domain tests assert behavior, not just execute code.
- Good: visual baselines are reproducible locally and in CI without CPU emulation.
- Bad: Vitest stays one major version behind until Stryker supports Vitest 5.
- Bad: running visual tests locally requires Docker.

## Revisit when

- stryker-js releases the fix for issue #6210: upgrade to Vitest 5.
- typescript-eslint supports TypeScript 7: evaluate the upgrade.
- Vue 3.6 becomes stable.
- npm/cli#9787 is fixed in npm 10: dependency changes no longer need npm 11.

## References

- [stryker-js issue #6210](https://github.com/stryker-mutator/stryker-js/issues/6210) and [pull request #6214](https://github.com/stryker-mutator/stryker-js/pull/6214)
- Playwright: [Clock](https://playwright.dev/docs/clock), [Visual comparisons](https://playwright.dev/docs/test-snapshots), [Docker](https://playwright.dev/docs/docker)
- GitHub: [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- Vitest: [Coverage configuration](https://vitest.dev/config/coverage)
- npm: [npm/cli#9787](https://github.com/npm/cli/issues/9787)
- Vue: [create-vue](https://github.com/vuejs/create-vue)
