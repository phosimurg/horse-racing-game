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
- Spec decisions D1 to D7 in the requirements:
  - always 20 horses;
  - Generate Program also draws a new roster;
  - no fatigue;
  - Generate Program disabled while paused;
  - rounds end when every horse finishes;
  - only a very slight upset factor.
- Removing the recruiter questions. The agent flagged two consequences: a roster is still drawn at load so the list is never empty, and a started race can only finish or be abandoned by reloading the page.

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

## Phase 1: Walking skeleton (2026-09-14)

### Where the agent was wrong or incomplete, and how it was caught

1. **The research summary got the scaffold's versions wrong.**
   - Issue: the tooling research reported versions that differ from the real create-vue 3.23.0 output, for example jsdom 30 instead of 29.1.1.
   - Caught by: reading the generated `package.json`.
   - Resolution: versions now come only from the npm registry and the generated files.
2. **npm crashed while installing.**
   - Issue: `npm install` crashed inside npm's resolver with `Cannot read properties of null (reading 'edgesOut')`.
   - Caught by: the npm debug log, a scratch reproduction with only Vitest 4.1.11, and the open issue npm/cli#9787.
   - Resolution: the lockfile is generated with npm 11, and a clean `npm ci` was verified with npm 10. The rule is in `AGENTS.md` and ADR 0003.
3. **The declared Node range did not match the dependencies.**
   - Issue: the scaffold declares Node `^22.18.0`, but its own npm-run-all2 9 and the `nopt` and `abbrev` packages pulled in by Vue Test Utils require `^22.22.2`. With `engine-strict`, installs failed on Node 22.19.
   - Caught by: an engine check of every package in the lockfile.
   - Resolution: the author upgraded to Node 22.23.2, and the project declares `^22.22.2 || ^24.15.0 || >=26.0.0`, which brought back the current jsdom, npm-run-all2 and lint-staged releases.
4. **The first lint run failed on the test tooling.**
   - Issues: the Playwright lint rule did not treat the axe helper as an assertion, and the console guard used `expect` outside a test and an unbound console method.
   - Caught by: the lint gates.
   - Resolution: the helper is registered through `assertFunctionNames`, and the guard now throws with the logged messages.
5. **Vite warned about an extensionless config import.**
   - Issue: Vite's native config loader, planned as the default, rejects the extensionless `./vite.config` import.
   - Caught by: the Vitest output.
   - Resolution: the import now uses the `.ts` extension.
6. **The preview tool started a different project.**
   - Issue: the Browser preview picked a launch configuration from another project in the parent folder.
   - Caught by: the reported server name and port.
   - Resolution: that server was stopped at once, and with the author's approval a dedicated entry was added to the parent launch configuration.
7. **Commit messages lost their headers.**
   - Issue: the first batch of commits put a shell line continuation after each message heredoc, which swallowed the Conventional Commit header.
   - Caught by: the commitlint hook rejected all eight messages before any commit was created.
   - Resolution: the commits were recreated by a script without line continuations.
8. **The application shell relied on the host background.**
   - Issue: in the Browser pane the shell showed the host's dark backdrop behind black text, because the page sets no colors of its own.
   - Caught by: the Browser pane screenshot.
   - Resolution: the temporary shell stays as it is; the Phase 4a tokens define explicit background and text colors for both themes (design section 8).

### Guardrails proven before relying on them

- `block-sensitive-files.mjs` exits 2 for `.env.local`, `package-lock.json` and a visual baseline, and 0 for `src/App.vue`.
- `allow-test-files-only.mjs` exits 2 for an implementation file and 0 for spec and end-to-end files.
- commitlint rejects a non-conventional header and an unknown scope, and accepts a valid message.
- ESLint reports all seven deliberate layer violations across the domain, stores, common components and UI kit.
- The commit-msg hook rejected eight malformed messages on its first real use.

## Phase 2: Domain (2026-09-14)

### Where the agent was wrong or incomplete, and how it was caught

1. **`randomInt` accepted ranges it cannot sample uniformly.**
   - Issue: the implementing agent kept every safe-integer range after the test-author asked about it, although a draw has only 2^32 possible values.
   - Caught by: the reviewer agent, which measured no odd results in 100,000 draws over a range of 2^33 integers.
   - Resolution: design 3.2 rejects ranges of more than 2^32 integers, and tests pin both sides of that boundary.
2. **Production code could import test helpers.**
   - Issue: the layer rules did not stop non-spec files from importing `src/test`, and the type-check would not either, so a stubbed generator could ship in the bundle.
   - Caught by: the reviewer agent, on the first spec that imports a shared helper.
   - Resolution: a `no-restricted-syntax` rule covers every layer (design 2.1).
3. **Two silk colors had no contrast margin.**
   - Issue: Magenta and Teal reached 4.5:1 only against pure black or white bib text; against `#151515` or `#f5f5f5` they fell to 4.18:1 and 4.37:1, and no test computed contrast.
   - Caught by: the reviewer agent, which measured every silk against near-black and near-white text.
   - Resolution: design 3.1 bounds the palette against `#151515` and `#f5f5f5`, a WCAG contrast test covers all 20 silks, and four colors were retuned to at least 5.06:1.
4. **The test helper rule missed re-exports and dynamic imports.**
   - Issue: the selector matched only import declarations, so `export * from '@/test/stubRng'` or `import()` in a barrel passed lint.
   - Caught by: the reviewer agent, re-checking the HRG-20 resolutions with in-memory ESLint probes.
   - Resolution: the rule also matches export-from declarations and import expressions.
5. **The design promised uniformity the formula cannot deliver.**
   - Issue: after the range cap, the design said every integer in a range is equally likely, but splitting 2^32 draw values is exact only for power-of-two range sizes.
   - Caught by: the reviewer agent, which counted the draw values that map to each result.
   - Resolution: sections 3.1 and 4.4 state the limit; the game's ranges hold at most 100 integers, where the skew is one draw value in 2^32.
6. **Stryker ran no tests.**
   - Issue: the Stryker config set `vitest.dir`, and Vitest resolves `include` globs against that directory, so no spec matched; the warning pointed at related mode instead.
   - Caught by: Stryker stopping with "No tests were executed", then `vitest run --dir src/domain/random` reproducing it.
   - Resolution: `vitest.dir` stays unset with a comment; a baseline killed all 173 mutants in the random and horse modules.
7. **A stopped agent had already written files.**
   - Issue: a test-author run reported as failed on the spend limit had written three spec files before it stopped.
   - Caught by: the next run, which found the untracked files and checked them against the design before keeping them.

### Loop changes (2026-09-15)

- The per-task subagent loop was too slow: one batched test-author run took about an hour, reviews took 10 to 15 minutes, and the monthly spend limit stopped the work twice.
- The author first batched HRG-22 to HRG-24 into one test-author run, then switched to fast mode: tests and code are written in the main session, the code-reviewer runs once per phase, e2e runs only when the rendered app changes, and pushes need no confirmation once the gates pass.
- Stryker moved ahead of the remaining domain tasks, and HRG-23 ran before HRG-22 because generateProgram calls simulateRound.

### Phase review

- The single Opus review of Phase 2 found no Critical or High issues. It flagged the missing leader tie rule (now in design 5.2 for HRG-33), unvalidated playback state, a finish-line test that checked one horse, a mutation path filter without the Vite config and `package.json`, and process docs that still required e2e on every pull request; all were fixed.

### Environment

- `npm run test:e2e` failed in all three browsers because no Playwright browsers are installed on the host. The gate ran in the pinned `mcr.microsoft.com/playwright:v1.63.0-noble` image with the existing `node_modules` volume, the image CI uses, so nothing was downloaded.

### Guardrails proven before relying on them

- The test helper rule rejects an alias import and a relative import in a `.ts` file and an alias import in a `.vue` file, and accepts spec files.
- The widened rule reports all six probe forms: an import, a named re-export, `export *`, a type re-export and a dynamic import in a `.ts` file, and a re-export in a `.vue` file. The first probe run printed nothing because ESLint 10 no longer ships the `unix` formatter, so the empty output was treated as a failed check, not a pass.

## Task log

| Task             | Delegated to the agent                                                                                                          | Kept by the author                                                                                              | Agent issue caught          | Rule added                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------- |
| HRG-01           | Running the scaffold command                                                                                                    | Approval of the scaffold options                                                                                | None                        | None                                                 |
| HRG-02 to HRG-07 | Drafting the plan copy, specifications, task breakdown, ADRs and this log from the approved plan                                | Approval with decisions D1 to D7, which changed the roster, pause and upset rules                               | None so far                 | None                                                 |
| HRG-10 to HRG-19 | Version and engine research, configuration drafts, crash diagnosis                                                              | Node upgrade to 22.23.2, local Docker use, GitHub Pages and the preview entry                                   | Phase 1 items 1 to 8        | Dependency changes use npm 11 (`AGENTS.md`)          |
| HRG-20           | Tests from design sections 3.1, 3.2 and 4.4 (test-author), mulberry32 reference values derived two ways, implementation, review | Phase 2 exit criteria and the Stryker installation; the design additions await review in the phase pull request | Phase 2 items 1, 2, 4 and 5 | Test helpers stay in spec files (`eslint.config.ts`) |
| HRG-21           | Tests from design sections 3.1, 4.2 and 4.4 (test-author), palette contrast and distinctness checks, implementation, review     | The name pool theme and the palette await review in the phase pull request                                      | Phase 2 item 3              | None                                                 |
| HRG-22 to HRG-24 | Batched tests (one test-author run on Sonnet 5), implementation, calibration check                                              | Batching, the Sonnet test-author, pushes without confirmation, then fast mode                                   | Phase 2 items 6 and 7       | Fast mode (`AGENTS.md`)                              |
| HRG-25           | Stryker setup, baseline and mutation workflow                                                                                   | Stryker ahead of the remaining domain tasks                                                                     | Phase 2 item 6              | `vitest.dir` stays unset (`stryker.config.mjs`)      |
