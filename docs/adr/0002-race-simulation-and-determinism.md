# ADR 0002: Race simulation and determinism

- Status: Accepted
- Date: 2026-09-14
- Related: [Design section 4](../specs/design.md#4-race-simulation), RACE-04, RACE-05, NFR-03

## Context and problem statement

Each round must produce a believable result where condition matters without dictating the outcome. Horses must move visibly, with lead changes. The race must pause, resume and replay exactly. Unit, end-to-end and visual tests must be deterministic.

## Decision drivers

- Results that can be explained in one sentence and reproduced from a seed.
- Pause, resume, dropped frames and hidden tabs must not change results or positions.
- Tests, including screenshots, without flakiness.
- Precomputation cheap enough for low-end devices.

## Considered options

1. **Live tick simulation:** each animation frame advances every horse by a random increment.
2. **Predetermined order:** draw the finishing order first, then animate horses toward it.
3. **Precomputed checkpoints:** simulate per-segment times from condition, per-round form and per-segment jitter, then play them back by interpolation.

## Decision outcome

Chosen option 3:

- All six rounds are simulated with a seeded mulberry32 generator when the program is generated.
- A horse's run is a list of cumulative checkpoint times, one per 100 m segment; placements sort by finish time, with ties broken by lane.
- `progressAt` interpolates between checkpoints, and `advancePlayback` is a pure reducer that moves time through the racing and intermission phases.

Option 1 couples results to frame rate and timing, which breaks determinism and pause semantics. Option 2 disconnects movement from the result: there are no genuine lead changes, and "condition matters" becomes a separate rule instead of an emergent property.

## Consequences

- Good:
  - Identical seeds and actions give identical races.
  - Playback stays exact after pauses and frame gaps.
- Good: randomness is consumed only at generation time, so rendering and timing cannot alter outcomes.
- Good: the simulation has no rendering dependency and can run on a server.
- Bad: results exist before they are shown; they stay out of the interface until each round completes.
- Bad: realism depends on tuned constants; calibration targets and Monte Carlo tests keep the tuning honest.

## Validation

- **Stubbed RNG:** with no variance, higher condition always wins; equal finish times fall back to lane order.
- **Seeded Monte Carlo test:** at least 2000 rounds are checked against the win-rate targets in design section 4.3, with bounds at least 5 standard errors wide.
- **Invariants:** checkpoints strictly increase, placements are a permutation of 1 to 10, and `advancePlayback` conserves elapsed time.
- **Mutation testing:** Stryker runs on `src/domain`.
