---
name: verify
description: Run the project's quality gates and report evidence. Use before declaring a task done, before committing and before opening a pull request.
allowed-tools: Bash(npm run *)
---

Run the gates in order and stop at the first failure:

1. `npm run verify`: lint, style lint, format check, type-check, unit tests with coverage thresholds, build and the traceability report.
2. `npm run test:e2e` when the rendered app or `e2e/` changed.
3. `npm run test:mutation` when files under `src/domain/` changed and the script exists.

For each gate report the command, pass or fail, and the key numbers: test count, coverage, mutation score, requirement IDs covered. On failure show the first relevant error lines and the likely cause. Never report a gate as passing unless it ran in this session.
