# AGENTS.md

Interactive horse racing game for the Insider One frontend assessment. Vue 3.5, TypeScript 6.0, Pinia 4, Vite 8, npm. Node `^22.22.2 || ^24.15.0 || >=26.0.0` (`.nvmrc`: 24).

## Source of truth

- Requirements, lifecycle table and author decisions: `docs/specs/requirements.md`
- Architecture, contracts, simulation and standards: `docs/specs/design.md`
- Tasks and status (`HRG-<n>`): `docs/specs/tasks.md`
- Decisions: `docs/adr/`
- `docs/implementation-plan.md` is a historical record: do not load it for context or edit it.

## Commands

- Install: `npm ci`
- Change dependencies (after approval): `npx npm@11 install <package>@<version>`; npm 10 crashes on this dependency graph (npm/cli#9787)
- Dev server: `npm run dev`
- All gates: `npm run verify`
- Unit tests: `npm run test:unit`; one file: `npx vitest run src/App.spec.ts`
- Coverage: `npm run test:coverage`
- End-to-end: `npm run test:e2e`; one file: `npx playwright test e2e/app-shell.spec.ts --project=e2e-chromium`
- Visual tests in Docker: `npm run test:visual:docker`; update baselines: `npm run test:visual:update`
- Lint: `npm run lint`; fix: `npm run lint:fix`; format: `npm run format`
- Requirement coverage: `npm run traceability`

## Architecture

- `src/domain`: pure TypeScript rules and simulation; no Vue, Pinia or DOM.
- `src/stores`: Pinia setup stores; global state changes only on user actions and round boundaries.
- `src/composables`: per-frame playback, RNG injection and app-level UI state.
- `src/components/ui`, `src/components/common`, `src/views/<Feature>/components`: props in, events out.
- `src/views/<Feature>/<Feature>View.vue`: the only components that use stores and composables.
- `src/utils`, `src/styles`, `src/test`; end-to-end and visual tests live in `e2e/`.

ESLint enforces the layer rules from design section 2.1. Path-scoped rules live in `.claude/rules/`.

## Boundaries

- Never edit `.env*`, key files, visual baselines (`e2e/**/*-snapshots/`), `dist/` or `coverage/`, and never hand-edit `package-lock.json`.
- Never add a dependency without the author's approval; verify it first with `npm view <package> version peerDependencies engines`.
- Never weaken or delete a test to make it pass.
- Update `docs/specs/design.md` before changing a domain contract.

## Workflow

- Work through `docs/specs/tasks.md` in the main session: failing tests first, then the implementation. Tightly coupled tasks may share a commit that lists every `Refs` ID.
- Run the `code-reviewer` agent once per phase, before its pull request.
- Requirement tests start their `describe` title with the ID, for example `describe('[PROG-02] round distances', ...)`.
- English everywhere; comments only where intent is not obvious from names.

## Definition of done

- `npm run verify` passes before every commit, `npm run test:e2e` passes when the rendered app or `e2e/` changed, and `npm run test:mutation` passes before a pull request that changes `src/domain`.
- New behavior has spec-derived assertions under a requirement ID.
- `docs/specs/tasks.md` and `docs/ai-workflow.md` are updated.

## Commits

Conventional Commits, enforced by commitlint: `type(scope): subject` in the imperative mood, at most 72 characters per line. Scopes: domain, stores, playback, ui, a11y, e2e, visual, ci, docs, ai, deps, config. The body explains the problem and the solution; the last line is `Refs: HRG-<n>`. No AI co-author trailers.
