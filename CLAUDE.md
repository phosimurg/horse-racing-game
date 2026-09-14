@AGENTS.md

## Claude Code

- Rules: `.claude/rules/` loads path-scoped rules for the domain, stores, Vue components, styles and tests.
- Agents:
  - `test-author` writes failing tests before implementation and can edit test files only.
  - `code-reviewer` reviews diffs read-only.
- Skills:
  - `/verify` runs the quality gates.
  - `/implement-task HRG-<n>` runs the test-first task loop.
- Hooks:
  - `block-sensitive-files.mjs` (PreToolUse) refuses edits to secrets, the lockfile, visual baselines and generated output.
  - `format-on-write.mjs` (PostToolUse) applies ESLint, Stylelint and Prettier fixes to every edited file.

## Compact instructions

When compacting, preserve the current phase and task ID, failing tests with their errors, decisions with their reasons, and open review findings.
