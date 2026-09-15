import { describe, expect, it } from 'vitest';

import { constantRng, LARGEST_DRAW, sequenceRng } from '@/test/stubRng';

import { generateHorses } from '../horse/generateHorses';
import type { Horse, HorseId } from '../horse/horse.types';
import { createRng } from '../random/createRng';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import { generateProgram } from './generateProgram';
import { simulateRound } from './simulateRound';

const SEEDS = [0, 1, 42, 2026, 4294967295];
// Arbitrary fixed seed for tests that need one roster but do not vary it by seed.
const SAMPLE_SEED = 7;
const STATISTICS_SEED = 20260915;
const STATISTICS_PROGRAMS = 1000;

// PROG-02: the distance of round n is 1200 + 200 * (n - 1).
const ROUND_DISTANCES = Array.from({ length: 6 }, (_, index) => 1200 + 200 * index);
const HORSES_PER_ROUND = 10;

// Design 3.2: each message starts with the function name and names its rule.
const TOO_FEW_HORSES_RULE =
    /^generateProgram:(?=.*\bhorses\b)(?=.*(?:fewer|at least|least 10|minimum))/i;
const DUPLICATE_ID_RULE = /^generateProgram:(?=.*\bid\b)(?=.*(?:duplicate|same|unique))/i;

function horse(id: HorseId, condition: number): Horse {
    return { id, name: `Horse ${id}`, color: { name: 'Gray', hex: '#8c939d' }, condition };
}

function rosterOf(seed: number): Horse[] {
    return generateHorses(createRng(seed));
}

function idsOf(horses: readonly Horse[]): HorseId[] {
    return horses.map((entry) => entry.id);
}

function repeat<T>(value: T, count: number): T[] {
    return Array.from({ length: count }, () => value);
}

describe('[PROG-01] generateProgram round count', () => {
    it('creates exactly 6 rounds across fixed seeds', () => {
        for (const seed of SEEDS) {
            const program = generateProgram(rosterOf(seed), createRng(seed));

            expect(program.rounds, `seed ${seed}`).toHaveLength(6);
        }
    });

    it('numbers the rounds 1 to 6 in order across fixed seeds', () => {
        for (const seed of SEEDS) {
            const program = generateProgram(rosterOf(seed), createRng(seed));

            expect(
                program.rounds.map((round) => round.number),
                `seed ${seed}`
            ).toEqual([1, 2, 3, 4, 5, 6]);
        }
    });
});

describe('[PROG-02] generateProgram round distances', () => {
    it('sets round n distance to 1200 + 200 * (n - 1) across fixed seeds', () => {
        for (const seed of SEEDS) {
            const program = generateProgram(rosterOf(seed), createRng(seed));

            expect(
                program.rounds.map((round) => round.distance),
                `seed ${seed}`
            ).toEqual(ROUND_DISTANCES);
        }
    });
});

describe('[PROG-03] generateProgram lineups and simulations', () => {
    it('fills each round with 10 distinct ids from the roster', () => {
        for (const seed of SEEDS) {
            const horses = rosterOf(seed);
            const rosterIds = new Set(idsOf(horses));
            const program = generateProgram(horses, createRng(seed));

            for (const round of program.rounds) {
                expect(new Set(round.horseIds).size, `seed ${seed}, round ${round.number}`).toBe(
                    HORSES_PER_ROUND
                );
                expect(
                    round.horseIds.every((id) => rosterIds.has(id)),
                    `seed ${seed}, round ${round.number}`
                ).toBe(true);
            }
        }
    });

    it('returns one simulation per round, whose round is that round', () => {
        for (const seed of SEEDS) {
            const program = generateProgram(rosterOf(seed), createRng(seed));

            expect(program.simulations, `seed ${seed}`).toHaveLength(6);
            program.simulations.forEach((simulation, index) => {
                expect(simulation.round, `seed ${seed}, round ${index + 1}`).toBe(
                    program.rounds[index]
                );
            });
        }
    });

    it('gives each simulation runs in lane order matching horseIds', () => {
        for (const seed of SEEDS) {
            const program = generateProgram(rosterOf(seed), createRng(seed));

            for (const simulation of program.simulations) {
                expect(
                    simulation.runs.map((run) => ({ horseId: run.horseId, lane: run.lane })),
                    `seed ${seed}, round ${simulation.round.number}`
                ).toEqual(
                    simulation.round.horseIds.map((horseId, index) => ({
                        horseId,
                        lane: index + 1,
                    }))
                );
            }
        }
    });
});

describe('[NFR-03] generateProgram draw order with a stubbed generator', () => {
    it('gives every round the first 10 roster ids in roster order when every draw is 0', () => {
        const horses = rosterOf(SAMPLE_SEED);
        const expectedIds = idsOf(horses).slice(0, HORSES_PER_ROUND);

        const program = generateProgram(horses, constantRng(0));

        for (const round of program.rounds) {
            expect(round.horseIds, `round ${round.number}`).toEqual(expectedIds);
        }
    });

    it('gives every round the last 10 roster ids in reverse order for the largest draw', () => {
        const horses = rosterOf(SAMPLE_SEED);
        const expectedIds = idsOf(horses).slice(-HORSES_PER_ROUND).reverse();

        const program = generateProgram(horses, constantRng(LARGEST_DRAW));

        for (const round of program.rounds) {
            expect(round.horseIds, `round ${round.number}`).toEqual(expectedIds);
        }
    });

    it('draws lineups equal to six sampleWithoutReplacement calls on a fresh generator', () => {
        for (const seed of SEEDS) {
            const horses = rosterOf(seed);
            const program = generateProgram(horses, createRng(seed));

            const rng = createRng(seed);
            const expectedLineups = ROUND_DISTANCES.map(() =>
                sampleWithoutReplacement(horses, HORSES_PER_ROUND, rng).map((entry) => entry.id)
            );

            expect(
                program.rounds.map((round) => round.horseIds),
                `seed ${seed}`
            ).toEqual(expectedLineups);
        }
    });

    it('computes simulations equal to simulateRound for each round on the same generator', () => {
        for (const seed of SEEDS) {
            const horses = rosterOf(seed);
            const horsesById = new Map(horses.map((entry) => [entry.id, entry]));
            const program = generateProgram(horses, createRng(seed));

            const rng = createRng(seed);
            const rounds = ROUND_DISTANCES.map((distance, index) => ({
                number: index + 1,
                distance,
                horseIds: sampleWithoutReplacement(horses, HORSES_PER_ROUND, rng).map(
                    (entry) => entry.id
                ),
            }));
            const expectedSimulations = rounds.map((round) =>
                simulateRound(round, horsesById, rng)
            );

            expect(program.simulations, `seed ${seed}`).toEqual(expectedSimulations);
        }
    });

    it.each([0, 0.5, LARGEST_DRAW])(
        'consumes exactly 1140 draws when every draw is %s: 60 for lineups, 1080 for simulations',
        (draw) => {
            // 6 rounds * 10 draws each for lineups = 60. Per horse, simulateRound draws
            // 1 + distance / 100, summed over the six distances: (1+12)+(1+14)+(1+16)+(1+18)+
            // (1+20)+(1+22) = 108; times 10 horses per round = 1080. Total 60 + 1080 = 1140.
            const horses = rosterOf(SAMPLE_SEED);
            const rng = sequenceRng(repeat(draw, 1140));

            generateProgram(horses, rng);

            expect(() => rng.next()).toThrow(/exhausted/);
        }
    );
});

describe('[PROG-03] generateProgram lineup distribution', () => {
    it('includes each horse in round 1 within 5 standard errors of half the programs', () => {
        // Each round draws 10 of 20 horses, so a horse appears in a given round with p = 0.5. Over
        // n = 1000 programs the count has mean 500 and standard error sqrt(1000 * 0.25) = 15.81;
        // 5 standard errors = 79.06.
        const horses = rosterOf(STATISTICS_SEED);
        const rng = createRng(STATISTICS_SEED);
        const programs = Array.from({ length: STATISTICS_PROGRAMS }, () =>
            generateProgram(horses, rng)
        );
        const probability = HORSES_PER_ROUND / horses.length;
        const expected = STATISTICS_PROGRAMS * probability;
        const tolerance = 5 * Math.sqrt(STATISTICS_PROGRAMS * probability * (1 - probability));

        for (const horseId of idsOf(horses)) {
            const inclusions = programs.filter((program) =>
                program.rounds[0]?.horseIds.includes(horseId)
            ).length;

            expect(inclusions, `horse ${horseId}`).toBeGreaterThan(expected - tolerance);
            expect(inclusions, `horse ${horseId}`).toBeLessThan(expected + tolerance);
        }
    });
});

describe('[NFR-03] generateProgram determinism', () => {
    it('returns deep-equal programs for the same seed', () => {
        for (const seed of SEEDS) {
            const horses = rosterOf(seed);

            expect(generateProgram(horses, createRng(seed)), `seed ${seed}`).toEqual(
                generateProgram(horses, createRng(seed))
            );
        }
    });

    it('returns different programs for different seeds', () => {
        const programs = SEEDS.map((seed) =>
            JSON.stringify(generateProgram(rosterOf(seed), createRng(seed)))
        );

        expect(new Set(programs).size).toBe(SEEDS.length);
    });
});

describe('[PROG-03] generateProgram input validation', () => {
    it('rejects fewer than 10 horses', () => {
        const horses = Array.from({ length: 9 }, (_, index) => horse(index + 1, 50));

        const call = () => generateProgram(horses, constantRng(0.5));

        expect(call).toThrow(TOO_FEW_HORSES_RULE);
        expect(call).not.toThrow(DUPLICATE_ID_RULE);
    });

    it('rejects an empty roster', () => {
        const call = () => generateProgram([], constantRng(0.5));

        expect(call).toThrow(TOO_FEW_HORSES_RULE);
    });

    it('rejects two horses with the same id', () => {
        const horses = [
            ...Array.from({ length: 9 }, (_, index) => horse(index + 1, 50)),
            horse(1, 75),
        ];

        const call = () => generateProgram(horses, constantRng(0.5));

        expect(call).toThrow(DUPLICATE_ID_RULE);
        expect(call).not.toThrow(TOO_FEW_HORSES_RULE);
    });

    it('accepts exactly 10 horses', () => {
        const horses = Array.from({ length: 10 }, (_, index) => horse(index + 1, 50));

        expect(() => generateProgram(horses, constantRng(0.5))).not.toThrow();
    });
});
