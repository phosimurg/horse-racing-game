---
paths:
  - '**/*.spec.ts'
  - 'e2e/**'
---

# Testing rules

- Put the requirement ID at the start of the `describe` title, for example `describe('[PROG-02] round distances', ...)`. `npm run traceability` checks these IDs.
- One behavior per test, asserting exact, spec-derived outcomes. A test that only executes code is not a test.
- Never weaken an assertion or delete a test to make it pass. When a test fails, decide whether the code or the spec is wrong and say which.
- Determinism: fixed seeds or a stubbed `Rng`, Vitest fake timers, and in Playwright `page.clock.install()` before `page.goto`, advancing with `runFor`. The installed clock keeps flowing in real time, so pause it with `page.clock.pauseAt()` after load when a test depends on exact progress, such as a screenshot.
- Unit and component tests fail on `console.warn` and `console.error`. Silence one only while asserting the expected message.
- Playwright: prefer `getByRole` and accessible names; use `data-testid` only when no accessible name exists. Tag cross-browser smoke tests with `@smoke`.
- Visual baselines change only through `npm run test:visual:update`, which runs in Docker.
