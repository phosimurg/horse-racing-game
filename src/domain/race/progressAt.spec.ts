import { describe, expect, it } from 'vitest';

import { generateHorses } from '../horse/generateHorses';
import { createRng } from '../random/createRng';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import { progressAt } from './progressAt';
import type { HorseRun } from './race.types';
import { simulateRound } from './simulateRound';

const SEEDS = [5, 2026, 4294967295];
const DISTANCES = [1200, 2200];
const GRID_STEP_MS = 5;

// Progress divides floating-point times, so it is compared to 12 decimal places.
const PROGRESS_DIGITS = 12;

// Three uneven segments: 0 to 100 ms, 100 to 300 ms and 300 to 600 ms.
const UNEVEN_RUN: HorseRun = { horseId: 1, lane: 1, checkpointsMs: [100, 300, 600] };

// For each seed: a roster, then 10 sampled horses and their runs for each distance.
function seededRuns(): { seed: number; distance: number; run: HorseRun }[] {
    return SEEDS.flatMap((seed) => {
        const rng = createRng(seed);
        const horses = generateHorses(rng);
        const horsesById = new Map(horses.map((horse) => [horse.id, horse]));

        return DISTANCES.flatMap((distance, index) => {
            const horseIds = sampleWithoutReplacement(horses, 10, rng).map((horse) => horse.id);
            const round = { number: index + 1, distance, horseIds };

            return simulateRound(round, horsesById, rng).runs.map((run) => ({
                seed,
                distance,
                run,
            }));
        });
    });
}

// Every GRID_STEP_MS from one step before 0 ms to at least one step after the finish, plus each
// checkpoint, in ascending order.
function timeGrid(run: HorseRun): number[] {
    const finish = run.checkpointsMs[run.checkpointsMs.length - 1] ?? 0;
    const steps = Math.ceil(finish / GRID_STEP_MS) + 2;
    const grid = Array.from({ length: steps + 1 }, (_, index) => (index - 1) * GRID_STEP_MS);

    return [...grid, ...run.checkpointsMs].sort((a, b) => a - b);
}

// Returns every pair of neighbors in which the later value is smaller or not a number.
function decreasingPairs(values: readonly number[]): number[][] {
    return values.slice(1).flatMap((value, index) => {
        const previous = values[index] ?? Number.NaN;

        return value >= previous ? [] : [[previous, value]];
    });
}

describe('[RACE-02] progressAt with hand-built checkpoints', () => {
    it.each([-50, -1, 0])('returns 0 at %s ms, at or before the start', (elapsedMs) => {
        expect(progressAt(UNEVEN_RUN, elapsedMs)).toBe(0);
    });

    // Within segment k of n, progress = (k - 1 + fraction of segment k elapsed) / n.
    it.each([
        { elapsedMs: 50, fraction: '1/6', expected: 1 / 6 }, // (0 + 50 / 100) / 3
        { elapsedMs: 100, fraction: '1/3', expected: 1 / 3 }, // checkpoint 1 of 3
        { elapsedMs: 200, fraction: '1/2', expected: 1 / 2 }, // (1 + 100 / 200) / 3
        { elapsedMs: 250, fraction: '7/12', expected: 7 / 12 }, // (1 + 150 / 200) / 3
        { elapsedMs: 300, fraction: '2/3', expected: 2 / 3 }, // checkpoint 2 of 3
        { elapsedMs: 400, fraction: '7/9', expected: 7 / 9 }, // (2 + 100 / 300) / 3
        { elapsedMs: 450, fraction: '5/6', expected: 5 / 6 }, // (2 + 150 / 300) / 3
    ])(
        'returns $fraction at $elapsedMs ms, linear within each segment',
        ({ elapsedMs, expected }) => {
            expect(progressAt(UNEVEN_RUN, elapsedMs)).toBeCloseTo(expected, PROGRESS_DIGITS);
        }
    );

    it.each([600, 601, 1000000])('returns 1 at %s ms, at or after the finish', (elapsedMs) => {
        expect(progressAt(UNEVEN_RUN, elapsedMs)).toBe(1);
    });

    it('interpolates a single-segment run linearly between 0 ms and its finish', () => {
        const run: HorseRun = { horseId: 2, lane: 1, checkpointsMs: [400] };

        expect([100, 200, 300].map((elapsedMs) => progressAt(run, elapsedMs))).toEqual([
            expect.closeTo(0.25, PROGRESS_DIGITS),
            expect.closeTo(0.5, PROGRESS_DIGITS),
            expect.closeTo(0.75, PROGRESS_DIGITS),
        ]);
    });
});

describe('[RACE-02] progressAt over seeded simulated runs', () => {
    it('returns 0 at 0 ms and k / n at the kth of n checkpoints', () => {
        for (const { seed, distance, run } of seededRuns()) {
            const count = run.checkpointsMs.length;

            expect(
                [0, ...run.checkpointsMs].map((elapsedMs) => progressAt(run, elapsedMs)),
                `seed ${seed}, ${distance} m, lane ${run.lane}`
            ).toEqual(
                Array.from({ length: count + 1 }, (_, k): unknown =>
                    expect.closeTo(k / count, PROGRESS_DIGITS)
                )
            );
        }
    });

    it('rises from 0 to 1 without ever decreasing on a 5 ms grid', () => {
        // Bracketing the samples with 0 and 1 also flags any value below 0 or above 1.
        for (const { seed, distance, run } of seededRuns()) {
            const progress = timeGrid(run).map((elapsedMs) => progressAt(run, elapsedMs));

            expect(
                decreasingPairs([0, ...progress, 1]),
                `seed ${seed}, ${distance} m, lane ${run.lane}`
            ).toEqual([]);
        }
    });
});
