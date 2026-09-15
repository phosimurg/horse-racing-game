---
name: implement-task
description: Implement one task from docs/specs/tasks.md with the test-first loop.
disable-model-invocation: true
argument-hint: '[HRG-id]'
---

Implement task $ARGUMENTS.

1. Scope: read its row in `docs/specs/tasks.md`, its requirement IDs and the related design sections. List the files you will touch; ask before continuing if anything is unclear.
2. Red: write the failing tests from the specification in this session and run them before writing implementation code.
3. Green: make the smallest change that passes the tests while following `.claude/rules/`.
4. Verify: run the `verify` skill and fix every failure.
5. Review: at the end of a phase, run the `code-reviewer` agent on the phase diff and resolve or explicitly reject each finding.
6. Record: mark the task in `docs/specs/tasks.md`, add a row to `docs/ai-workflow.md` and commit with a Conventional Commit that ends with `Refs: $ARGUMENTS`.
