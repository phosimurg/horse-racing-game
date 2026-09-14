# AI-Assisted Workflow Log

This project is built with an AI coding agent (Claude Code) under the author's direction. The log records, per task, what was delegated, what the author decided, where the agent was wrong or incomplete and how that was caught. Entries are written while the work happens.

## Working agreement

- The author owns every decision and reviews every diff; agent output is untrusted until verified.
- Facts that shape decisions (package versions, API behavior, company practices) are checked against primary sources before use: the npm registry, official documentation and the GitHub API.
- A separate test-author agent writes tests before the implementation, and a read-only reviewer agent checks every diff. Both are configured in Phase 1.
- Recurring mistakes become rules in `AGENTS.md` or `.claude/rules/`, so the fix lives in the context rather than in a one-off prompt.

## Planning session (2026-09-14)

### Inputs and tooling

- **The brief:** a 2-page PDF. No PDF rendering tool was installed, so the text was extracted with macOS PDFKit and the example UI on page 2 was read with on-device OCR (Vision framework), without writing any files.
- **Research:** Insider One's public engineering practices were researched by three parallel, read-only research agents, one each for engineering standards, AI practices and current Vue tooling. Each had to cite its sources.

### Delegated to the agent

- Public research and summaries with source links.
- Version and compatibility checks against the npm registry.
- Drafts of the plan, the specifications and the ADRs.
- An independent critique of the draft plan by a separate planning agent.

### Decided by the author

- Conventional Commits for this repository.
- The official Vue toolchain, styled after Insider One's shared ESLint configuration, instead of adopting that configuration directly.
- A public repository with one pull request per phase and confirmation before every push.
- A modern, original interface instead of a copy of the example, with responsive layout and accessibility as hard requirements.
- A written rationale for leaving out a router, a component library and Tailwind, now recorded in ADR 0001.
- Publishing the approved plan in the repository for reviewers.

### Where the agent was wrong or incomplete, and how it was caught

1. **Vitest 5 would have made mutation testing silently useless.**
   - Issue: the draft plan pinned Vitest 5.0.0 and relied on a Stryker dry run. Stryker's vitest-runner 10.0.0 matches no tests on Vitest 5, so every mutant survives while a dry run still passes.
   - Caught by: the independent plan review, then confirmed through the GitHub API (issue #6210 open, fix pull request #6214 not merged).
   - Resolution: Vitest pinned to 4.1.11, and a planted mutant must be reported Killed.
2. **The race clock was a per-frame store action.**
   - Issue: the draft advanced the clock with a Pinia action on every animation frame, which floods the Pinia devtools timeline and ties store tests to timers.
   - Caught by: the independent plan review.
   - Resolution: the clock moved to a pure `advancePlayback` reducer driven by a composable; stores change only at round boundaries (ADR 0001).
3. **The simulation was nearly deterministic.**
   - Issue: the draft used only per-segment randomness, which averages out over 12 to 22 segments.
   - Caught by: the independent plan review, then confirmed by re-deriving the spread of the finish times.
   - Resolution: a per-round form factor with Monte Carlo calibration targets (ADR 0002).
4. **The steps were in the wrong order.**
   - Issue: the draft wrote the specification documents before scaffolding, but create-vue prompts or overwrites when the target directory is not empty.
   - Caught by: the independent plan review, consistent with the create-vue CLI help.
   - Resolution: the untouched scaffold is the first commit, and the documents follow.
5. **Visual baselines relied on CPU emulation.**
   - Issue: the draft generated screenshot baselines under amd64 emulation on Apple Silicon.
   - Caught by: the independent plan review, then confirmed that the Playwright image ships arm64 and that GitHub offers free arm64 runners for public repositories.
   - Resolution: baselines and CI both run natively on arm64.
6. **The wrong Playwright clock API.**
   - Issue: the draft planned `page.clock.fastForward`, which fires due timers only once and would stall an animation-frame loop.
   - Caught by: the independent plan review, then confirmed in the Playwright clock documentation.
   - Resolution: end-to-end tests advance time with `runFor` only.
7. **Research cited articles that could not be opened.**
   - Issue: research summaries cited Insider One articles whose pages returned HTTP 403.
   - Caught by: checking the claims against the publication's RSS feeds before relying on them.
   - Resolution: only verified statements are cited.
8. **The planned runner icon was not a racehorse.**
   - Issue: the Phosphor icon set was proposed for the horse runner.
   - Caught by: rendering the icon, which showed a chess-knight head.
   - Resolution: an original SVG runner; Phosphor is kept for controls.
9. **A stale performance tool was proposed.**
   - Issue: Lighthouse CI was proposed as an automated performance gate.
   - Caught by: the npm registry, which shows the package was last published in June 2025 on Lighthouse 12.6.
   - Resolution: a manual Lighthouse audit recorded at delivery (NFR-05).

### Review findings not adopted

- **Drop the test-author agent. Decision: rejected.** Tests must not come from the prompt that writes the implementation, and the agent's own hook limits it to test files.

Accepted as proposed: drop knip, reduce the ADRs from six to three, run mutation tests on the domain only, bundle the font for screenshots, and add a spec glossary with explicit empty, intermission and control states.

## Task log

| Task | Delegated to the agent | Kept by the author | Agent issue caught | Rule added |
| --- | --- | --- | --- | --- |
| HRG-01 | Running the scaffold command | Approval of the scaffold options | None | None |
| HRG-02 to HRG-07 | Drafting the plan copy, specifications, task breakdown, ADRs and this log from the approved plan | Approval of requirements, assumptions and contracts (pending) | None so far | None |
