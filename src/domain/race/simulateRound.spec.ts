import { describe, expect, it } from 'vitest';

import { constantRng, LARGEST_DRAW, sequenceRng } from '@/test/stubRng';

import { generateHorses } from '../horse/generateHorses';
import type { Horse, HorseId } from '../horse/horse.types';
import { createRng } from '../random/createRng';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import type { HorseRun, Round, RoundSimulation } from './race.types';
import { simulateRound } from './simulateRound';

const SEEDS = [1, 42, 2026, 4294967295];
const ROUND_DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200];
const LANE_ORDER: readonly HorseId[] = [14, 3, 9, 20, 1, 7, 12, 5, 18, 10];

// Checkpoints add up floating-point segment times, so they are compared to 4 decimal places.
const MS_DIGITS = 4;

// 10080 is the least common multiple of the pairing cycles of gaps 10, 20 and 30 (180, 160 and
// 140 rounds), so every gap runs whole cycles.
const CALIBRATION_ROUNDS = 10080;

// Design 3.2: each message starts with the function name and names its rule.
const NO_HORSES_RULE =
    /^simulateRound:(?=.*\bhorse)(?=.*(?:without|empty|at least (?:one|1)|no horses))/i;
const MISSING_HORSE_RULE = /^simulateRound:(?=.*\bhorse)(?=.*(?:missing|unknown|not found))/i;
const DISTANCE_RULE = /^simulateRound:(?=.*\bdistance\b)(?=.*\bmultiple\b)/i;

function horse(id: HorseId, condition: number): Horse {
    return { id, name: `Horse ${id}`, color: { name: 'Gray', hex: '#8c939d' }, condition };
}

function mapById(horses: readonly Horse[]): ReadonlyMap<HorseId, Horse> {
    return new Map(horses.map((entry) => [entry.id, entry]));
}

function roundOf(distance: number, horseIds: readonly HorseId[]): Round {
    return { number: 1, distance, horseIds };
}

function repeat<T>(value: T, count: number): T[] {
    return Array.from({ length: count }, () => value);
}

function finishTimeOf(run: HorseRun): number {
    return run.checkpointsMs[run.checkpointsMs.length - 1] ?? Number.NaN;
}

function closeToMs(values: readonly number[]): unknown[] {
    return values.map((value): unknown => expect.closeTo(value, MS_DIGITS));
}

// Checkpoint k of a run whose segments all take segmentMs is k * segmentMs.
function evenCheckpoints(segmentMs: number, segments: number): unknown[] {
    return closeToMs(Array.from({ length: segments }, (_, index) => (index + 1) * segmentMs));
}

// Returns every pair of neighbors in which the later value is not strictly greater.
function nonIncreasingPairs(values: readonly number[]): number[][] {
    return values.slice(1).flatMap((value, index) => {
        const previous = values[index] ?? Number.NaN;

        return value > previous ? [] : [[previous, value]];
    });
}

// For each seed: a roster, then 10 sampled horses and their simulation for each program distance.
function seededSimulations(): { seed: number; simulation: RoundSimulation }[] {
    return SEEDS.flatMap((seed) => {
        const rng = createRng(seed);
        const horses = generateHorses(rng);
        const horsesById = mapById(horses);

        return ROUND_DISTANCES.map((distance, index) => {
            const horseIds = sampleWithoutReplacement(horses, 10, rng).map((entry) => entry.id);
            const round = { number: index + 1, distance, horseIds };

            return { seed, simulation: simulateRound(round, horsesById, rng) };
        });
    });
}

function runOf(simulation: RoundSimulation, horseId: HorseId): HorseRun {
    const run = simulation.runs.find((entry) => entry.horseId === horseId);
    if (run === undefined) {
        throw new Error(`The simulation has no run for horse ${horseId}`);
    }
    return run;
}

// A win is a strictly earlier finish, or an equal finish from the lower lane.
function beats(run: HorseRun, rival: HorseRun): boolean {
    const finish = finishTimeOf(run);
    const rivalFinish = finishTimeOf(rival);

    return finish < rivalFinish || (finish === rivalFinish && run.lane < rival.lane);
}

// Design 4.3 pairing at 1200 m: round i races lower condition 1 + floor(i / 2) % (100 - gap)
// against lower + gap, with the better horse in lane 1 for even i and in lane 2 for odd i, so each
// lower condition runs once from each lane per cycle. The seed is the gap, fixed before any
// calibration result existed.
function betterHorseWinRate(gap: number): { rate: number; standardError: number } {
    const rng = createRng(gap);
    let wins = 0;

    for (let index = 0; index < CALIBRATION_ROUNDS; index += 1) {
        const lower = 1 + (Math.floor(index / 2) % (100 - gap));
        const better = lower + gap;
        const horseIds = index % 2 === 0 ? [better, lower] : [lower, better];
        const simulation = simulateRound(roundOf(1200, horseIds), HORSES_BY_CONDITION, rng);

        wins += beats(runOf(simulation, better), runOf(simulation, lower)) ? 1 : 0;
    }
    const rate = wins / CALIBRATION_ROUNDS;

    return { rate, standardError: Math.sqrt((rate * (1 - rate)) / CALIBRATION_ROUNDS) };
}

// Horse n has condition 5 * n.
const ROSTER = mapById(Array.from({ length: 20 }, (_, index) => horse(index + 1, 5 * (index + 1))));

// Horse n has condition n.
const HORSES_BY_CONDITION = mapById(
    Array.from({ length: 100 }, (_, index) => horse(index + 1, index + 1))
);

// Lane i + 1 holds horse (37 * i) % 100 + 1: every id from 1 to 100 once, because 37 and 100 are
// coprime, and out of condition order.
const SCRAMBLED_IDS = Array.from({ length: 100 }, (_, index) => ((37 * index) % 100) + 1);
const DESCENDING_CONDITIONS = Array.from({ length: 100 }, (_, index) => 100 - index);

// Lanes 1 to 3 hold horse 7 (condition 50), horse 3 (condition 100) and horse 12 (condition 1).
const MIXED_HORSES = mapById([horse(7, 50), horse(3, 100), horse(12, 1)]);
const MIXED_ROUND = roundOf(1200, [7, 3, 12]);

describe('[RACE-04] simulateRound runs and checkpoints', () => {
    it('returns one run per horse in lane order, with lane = index in horseIds + 1', () => {
        const { runs } = simulateRound(roundOf(1200, LANE_ORDER), ROSTER, createRng(42));

        expect(runs.map(({ horseId, lane }) => ({ horseId, lane }))).toEqual(
            LANE_ORDER.map((horseId, index) => ({ horseId, lane: index + 1 }))
        );
    });

    it('returns the given round', () => {
        const round = roundOf(1400, [2, 11, 6]);

        expect(simulateRound(round, ROSTER, createRng(42)).round).toBe(round);
    });

    // Rows are [distance, checkpoints] with checkpoints = distance / 100.
    it.each([
        [100, 1],
        [1200, 12],
        [1400, 14],
        [1600, 16],
        [1800, 18],
        [2000, 20],
        [2200, 22],
    ])('gives every run over %s m exactly %s checkpoints', (distance, checkpoints) => {
        const { runs } = simulateRound(roundOf(distance, LANE_ORDER), ROSTER, createRng(7));

        expect(runs.map((run) => run.checkpointsMs.length)).toEqual(repeat(checkpoints, 10));
    });

    it('returns checkpoints that strictly increase from 0 ms across fixed seeds', () => {
        for (const { seed, simulation } of seededSimulations()) {
            for (const run of simulation.runs) {
                expect(
                    nonIncreasingPairs([0, ...run.checkpointsMs]),
                    `seed ${seed}, ${simulation.round.distance} m, lane ${run.lane}`
                ).toEqual([]);
            }
        }
    });

    it('sets durationMs to the largest finish time across fixed seeds', () => {
        for (const { seed, simulation } of seededSimulations()) {
            expect(simulation.durationMs, `seed ${seed}, ${simulation.round.distance} m`).toBe(
                Math.max(...simulation.runs.map(finishTimeOf))
            );
        }
    });

    it('sets durationMs to the finish time of the slowest horse outside the last lane', () => {
        // Every draw is 0.5, so the condition 1 horse in lane 2 is the slowest and finishes after
        // 12 * 100000 / (288 * 0.8218) = 12 * 100000 / 236.6784 = 5070.1712 ms.
        const horses = mapById([horse(1, 80), horse(2, 1), horse(3, 100)]);

        const { durationMs } = simulateRound(roundOf(1200, [1, 2, 3]), horses, constantRng(0.5));

        expect(durationMs).toBeCloseTo((12 * 100000) / 236.6784, MS_DIGITS);
    });
});

// Design 4.1 and 4.2: segmentMs = 100 / (16 * conditionFactor * form * jitter) * 1000 / 18
// = 100000 / (288 * conditionFactor * form * jitter), where conditionFactor = 0.82 + 0.18 *
// condition / 100 is 0.91 at condition 50, 1 at condition 100 and 0.8218 at condition 1. A draw d
// gives form = 1 + 0.02 * (2 * d - 1) and jitter = 1 + 0.05 * (2 * d - 1).
describe('[RACE-04] simulateRound segment times with constant draws', () => {
    it('gives form 1 and jitter 1 when every draw is 0.5', () => {
        // Condition 50: 100000 / (288 * 0.91) = 100000 / 262.08 = 381.5629 ms per segment.
        // Condition 100: 100000 / 288 = 347.2222 ms per segment.
        // Condition 1: 100000 / (288 * 0.8218) = 100000 / 236.6784 = 422.5143 ms per segment.
        const { runs } = simulateRound(MIXED_ROUND, MIXED_HORSES, constantRng(0.5));

        expect(runs.map((run) => run.checkpointsMs)).toEqual([
            evenCheckpoints(100000 / 262.08, 12),
            evenCheckpoints(100000 / 288, 12),
            evenCheckpoints(100000 / 236.6784, 12),
        ]);
    });

    it('gives form 0.98 and jitter 0.95 when every draw is 0', () => {
        // form * jitter = 0.98 * 0.95 = 0.931.
        // Condition 50: 100000 / (262.08 * 0.931) = 100000 / 243.99648 = 409.8420 ms per segment.
        // Condition 100: 100000 / (288 * 0.931) = 100000 / 268.128 = 372.9562 ms per segment.
        // Condition 1: 100000 / (236.6784 * 0.931) = 100000 / 220.3475904 = 453.8284 ms per segment.
        const { runs } = simulateRound(MIXED_ROUND, MIXED_HORSES, constantRng(0));

        expect(runs.map((run) => run.checkpointsMs)).toEqual([
            evenCheckpoints(100000 / 243.99648, 12),
            evenCheckpoints(100000 / 268.128, 12),
            evenCheckpoints(100000 / 220.3475904, 12),
        ]);
    });

    it('gives form 1.02 and jitter 1.05 when every draw is the largest', () => {
        // 2 * LARGEST_DRAW - 1 = 1 - 2^-31, so form and jitter fall short of 1.02 and 1.05 by less
        // than 3e-11, which moves no checkpoint by 0.000001 ms. form * jitter = 1.02 * 1.05 = 1.071.
        // Condition 50: 100000 / (262.08 * 1.071) = 100000 / 280.68768 = 356.2679 ms per segment.
        // Condition 100: 100000 / (288 * 1.071) = 100000 / 308.448 = 324.2038 ms per segment.
        // Condition 1: 100000 / (236.6784 * 1.071) = 100000 / 253.4825664 = 394.5044 ms per segment.
        const { runs } = simulateRound(MIXED_ROUND, MIXED_HORSES, constantRng(LARGEST_DRAW));

        expect(runs.map((run) => run.checkpointsMs)).toEqual([
            evenCheckpoints(100000 / 280.68768, 12),
            evenCheckpoints(100000 / 308.448, 12),
            evenCheckpoints(100000 / 253.4825664, 12),
        ]);
    });
});

describe('[RACE-04] simulateRound draw order', () => {
    it("draws each horse's form, then one jitter per segment, horse by horse in lane order", () => {
        // Draw   Use                      Factor
        // 0.75   lane 1 form              1 + 0.02 * 0.5 = 1.01
        // 0.25   lane 1 segment 1 jitter  1 + 0.05 * -0.5 = 0.975
        // 0.875  lane 1 segment 2 jitter  1 + 0.05 * 0.75 = 1.0375
        // 0.125  lane 2 form              1 + 0.02 * -0.75 = 0.985
        // 0      lane 2 segment 1 jitter  1 + 0.05 * -1 = 0.95
        // 0.5    lane 2 segment 2 jitter  1 + 0.05 * 0 = 1
        // Lane 1 holds horse 5 with condition 100 (conditionFactor 1):
        //   segment 1: 100000 / (288 * 1.01 * 0.975) = 100000 / 283.608 = 352.5994 ms
        //   segment 2: 100000 / (288 * 1.01 * 1.0375) = 100000 / 301.788 = 331.3584 ms
        // Lane 2 holds horse 2 with condition 50 (conditionFactor 0.91):
        //   segment 1: 100000 / (262.08 * 0.985 * 0.95) = 100000 / 245.24136 = 407.7616 ms
        //   segment 2: 100000 / (262.08 * 0.985 * 1) = 100000 / 258.1488 = 387.3736 ms
        // The draws are distinct, so consuming them in another order changes a checkpoint, and a
        // seventh draw exhausts the generator.
        const horses = mapById([horse(5, 100), horse(2, 50)]);
        const rng = sequenceRng([0.75, 0.25, 0.875, 0.125, 0, 0.5]);

        const { runs } = simulateRound(roundOf(200, [5, 2]), horses, rng);

        expect(runs.map((run) => run.checkpointsMs)).toEqual([
            closeToMs([100000 / 283.608, 100000 / 283.608 + 100000 / 301.788]),
            closeToMs([100000 / 245.24136, 100000 / 245.24136 + 100000 / 258.1488]),
        ]);
    });

    // Rows are [draws, horses, distance] with draws = horses * (1 + distance / 100).
    it.each([
        [2, 1, 100],
        [39, 3, 1200],
        [130, 10, 1200],
        [230, 10, 2200],
    ])('consumes exactly %s draws for %s horses over %s m', (draws, count, distance) => {
        const rng = sequenceRng(repeat(0.5, draws));

        simulateRound(roundOf(distance, LANE_ORDER.slice(0, count)), ROSTER, rng);

        expect(() => rng.next()).toThrow(/exhausted/);
    });
});

describe('[RACE-04] simulateRound condition dominance', () => {
    // A constant draw gives every horse the same form and jitter, so only condition sets the pace.
    it.each([0, 0.5, LARGEST_DRAW])(
        'finishes a higher condition strictly earlier when every draw is %s',
        (draw) => {
            const { runs } = simulateRound(
                roundOf(1200, SCRAMBLED_IDS),
                HORSES_BY_CONDITION,
                constantRng(draw)
            );
            const byFinish = [...runs].sort((a, b) => finishTimeOf(a) - finishTimeOf(b));

            expect(byFinish.map((run) => run.horseId)).toEqual(DESCENDING_CONDITIONS);
            expect(nonIncreasingPairs(byFinish.map(finishTimeOf))).toEqual([]);
        }
    );
});

// Design 4.3 and decision D7. For an observed win rate p over n = 10080 rounds, the standard error
// is SE = sqrt(p * (1 - p) / 10080), and p must sit at least 5 SE inside every finite bound of its
// band. SE peaks at p = 0.5 with sqrt(0.25 / 10080) = 0.00498, so 5 SE never exceeds 0.0249.
describe('[RACE-04] simulateRound calibration', () => {
    it('lets the better horse win 75% to 92% of rounds with a condition gap of 10', () => {
        // p - 5 * SE >= 0.75 and p + 5 * SE <= 0.92 hold together only for 7771 to 9126 wins,
        // that is p from 0.7709 to 0.9054.
        const { rate, standardError } = betterHorseWinRate(10);

        expect(rate - 5 * standardError).toBeGreaterThanOrEqual(0.75);
        expect(rate + 5 * standardError).toBeLessThanOrEqual(0.92);
    });

    it('lets the better horse win at least 93% of rounds with a condition gap of 20', () => {
        // p - 5 * SE >= 0.93 holds only for at most 587 losses, that is p of at least 0.9417.
        const { rate, standardError } = betterHorseWinRate(20);

        expect(rate - 5 * standardError).toBeGreaterThanOrEqual(0.93);
    });

    it('lets the better horse win at least 99% of rounds with a condition gap of 30', () => {
        // p - 5 * SE >= 0.99 holds only for at most 61 losses, that is p of at least 0.9939.
        const { rate, standardError } = betterHorseWinRate(30);

        expect(rate - 5 * standardError).toBeGreaterThanOrEqual(0.99);
    });
});

// Design 4.3 playback targets. With every draw 0.5, condition 1 takes 100000 / 236.6784 = 422.5143
// ms per segment and condition 100 takes 100000 / 288 = 347.2222 ms: 5070.17 and 4166.67 ms over
// 1200 m, and 9295.31 and 7638.89 ms over 2200 m.
describe('[RACE-04] simulateRound playback targets', () => {
    it.each([
        [1200, 4000, 6000],
        [2200, 7000, 10000],
    ])(
        'finishes conditions 1 and 100 over %s m within %s to %s ms when every draw is 0.5',
        (distance, earliest, latest) => {
            const horses = mapById([horse(1, 1), horse(2, 100)]);

            const { runs } = simulateRound(roundOf(distance, [1, 2]), horses, constantRng(0.5));
            const finishTimes = runs.map(finishTimeOf);

            expect(finishTimes).toHaveLength(2);
            expect(Math.min(...finishTimes)).toBeGreaterThanOrEqual(earliest);
            expect(Math.max(...finishTimes)).toBeLessThanOrEqual(latest);
        }
    );
});

describe('[RACE-04] simulateRound input validation', () => {
    it('rejects a round without horses', () => {
        const call = () => simulateRound(roundOf(1200, []), ROSTER, constantRng(0.5));

        expect(call).toThrow(NO_HORSES_RULE);
        expect(call).not.toThrow(MISSING_HORSE_RULE);
        expect(call).not.toThrow(DISTANCE_RULE);
    });

    it.each([
        { lane: 1, horseIds: [21, 1, 2] },
        { lane: 2, horseIds: [1, 21, 2] },
        { lane: 3, horseIds: [1, 2, 21] },
    ])('rejects horse id 21, missing from horsesById, in lane $lane', ({ horseIds }) => {
        const call = () => simulateRound(roundOf(1200, horseIds), ROSTER, constantRng(0.5));

        expect(call).toThrow(MISSING_HORSE_RULE);
        expect(call).not.toThrow(NO_HORSES_RULE);
        expect(call).not.toThrow(DISTANCE_RULE);
    });

    it.each([0, -100, 150, 1250, Number.NaN])(
        'rejects the distance %s, which is not a positive multiple of 100',
        (distance) => {
            const call = () => simulateRound(roundOf(distance, [1, 2]), ROSTER, constantRng(0.5));

            expect(call).toThrow(DISTANCE_RULE);
            expect(call).not.toThrow(NO_HORSES_RULE);
            expect(call).not.toThrow(MISSING_HORSE_RULE);
        }
    );

    it('accepts a single horse over the shortest distance, 100 m', () => {
        expect(() => simulateRound(roundOf(100, [1]), ROSTER, constantRng(0.5))).not.toThrow();
    });
});
