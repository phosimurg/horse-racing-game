---
paths:
  - 'src/domain/**'
---

# Domain rules

- Pure TypeScript only: never import Vue, Pinia, `@/stores`, `@/composables`, `@/components`, `@/views` or `@/utils`, and never use DOM globals. ESLint enforces this.
- Functions are deterministic for a given `Rng`; never call `Math.random`, `Date.now` or `performance.now`.
- Types, constants and signatures follow `docs/specs/design.md` sections 3 and 4. Change the design before changing a contract.
- Validate inputs at public entry points and throw an `Error` whose message names the violated rule.
- Expose the public API only through `src/domain/index.ts`.
- Tests use exact cases with a stubbed `Rng`, invariants over fixed seeds, and statistical bounds of at least 5 standard errors. Coverage stays at 100% and Stryker must kill the mutants.
