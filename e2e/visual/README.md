# Visual regression

Ten baselines cover the dashboard in both themes on a desktop (1440 by 900) and a phone (390 by 844): the application shell, a race paused on lap 2, an idle phone, a ready program, a finished race and the phone Results tab.

## How the screenshots stay deterministic

- Every test opens `/?seed=20260915` (the shell uses `seed=1`), so horses, programs and results are identical.
- `page.clock.install()` runs before `page.goto`, `page.clock.pauseAt()` stops the flowing clock, and only `runFor` moves the race.
- The `visual` project uses reduced motion, disabled animations, a hidden caret and the bundled font.
- Screenshots are taken only in `mcr.microsoft.com/playwright:v1.63.0-noble` on arm64: locally in Docker on Apple Silicon and in CI on `ubuntu-24.04-arm`.
- The tolerance is `maxDiffPixelRatio: 0.001`. The `visual` project never retries, and `updateSnapshots: 'none'` fails a missing baseline instead of writing it.

## Comparing

```bash
npm run test:visual:docker
```

On failure, `playwright-report/` and `test-results/` hold the expected, actual and diff images. In CI they are uploaded as the `playwright-report-visual` artifact.

## Updating baselines

Update baselines only when a visual change is intended, and review every changed image before committing it.

Locally, in the pinned image:

```bash
npm run test:visual:update
```

Or in CI, without Docker on the machine:

```bash
gh workflow run CI --ref <branch> -f update-snapshots=true
```

```bash
gh run download <run-id> -n visual-baselines -D e2e
```

Commit the images with a `test(visual)` commit that explains the visual change. Never edit or copy PNG files by hand, and never commit baselines rendered outside the pinned image, for example files ending in `-darwin.png`.
