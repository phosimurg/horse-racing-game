import { describe, expect, it } from 'vitest';

import { createRng } from './createRng';
import type { Rng } from './random.types';

const TWO_TO_THE_32 = 4294967296;

// First five uint32 outputs of Tommy Ettinger's mulberry32 reference algorithm, computed with two
// independent implementations (Math.imul and BigInt modulo 2^32) that agree over 200000 draws.
const SEED_42_OUTPUTS = [2581720956, 1925393290, 3661312704, 2876485805, 750819978];
const SEED_0_OUTPUTS = [1144304738, 1416247, 958946056, 627933444, 2007157716];
const SEED_4294967295_OUTPUTS = [3850105811, 813802916, 3073704848, 4054706436, 3630262831];

const SEEDS = [0, 1, 42, 20260914, 4294967295];
const STATISTICS_SEED = 20260914;
const STATISTICS_DRAWS = 20000;

// Design 3.2: the message names the rule, so it mentions "integer" and the bound 4294967295.
const SEED_RULE = /^(?=.*integer)(?=.*4294967295)/i;

function drawMany(rng: Rng, count: number): number[] {
    return Array.from({ length: count }, () => rng.next());
}

describe('[NFR-03] createRng', () => {
    it.each([
        [42, SEED_42_OUTPUTS],
        [0, SEED_0_OUTPUTS],
        [4294967295, SEED_4294967295_OUTPUTS],
    ])('returns the mulberry32 reference outputs divided by 2^32 for seed %s', (seed, outputs) => {
        expect(drawMany(createRng(seed), outputs.length)).toEqual(
            outputs.map((output) => output / TWO_TO_THE_32)
        );
    });

    it('returns the same sequence of 1000 draws for the same seed', () => {
        for (const seed of SEEDS) {
            expect(drawMany(createRng(seed), 1000), `seed ${seed}`).toEqual(
                drawMany(createRng(seed), 1000)
            );
        }
    });

    it('returns different sequences for different seeds', () => {
        const sequences = SEEDS.map((seed) => drawMany(createRng(seed), 10).join());

        expect(new Set(sequences).size).toBe(SEEDS.length);
    });

    it('keeps separate state for two generators with the same seed when draws interleave', () => {
        const first = createRng(42);
        const second = createRng(42);

        const pairs = Array.from({ length: SEED_42_OUTPUTS.length }, () => [
            first.next(),
            second.next(),
        ]);

        expect(pairs).toEqual(
            SEED_42_OUTPUTS.map((output) => [output / TWO_TO_THE_32, output / TWO_TO_THE_32])
        );
    });

    it('returns values in [0, 1) across fixed seeds', () => {
        const values = SEEDS.flatMap((seed) => drawMany(createRng(seed), 10000));

        expect(values.filter((value) => Number.isNaN(value) || value < 0 || value >= 1)).toEqual(
            []
        );
    });

    it('returns a 32-bit output divided by 2^32 on every draw', () => {
        const values = SEEDS.flatMap((seed) => drawMany(createRng(seed), 10000));

        expect(values.filter((value) => !Number.isInteger(value * TWO_TO_THE_32))).toEqual([]);
    });
});

describe('[NFR-03] createRng distribution', () => {
    it('keeps the mean of 20000 draws within 5 standard errors of 1/2', () => {
        // A uniform draw on [0, 1) has variance 1/12, so the mean of n = 20000 draws has
        // standard error sqrt(1 / 12 / 20000) = 0.00204; 5 standard errors = 0.0102.
        const values = drawMany(createRng(STATISTICS_SEED), STATISTICS_DRAWS);
        const mean = values.reduce((sum, value) => sum + value, 0) / STATISTICS_DRAWS;
        const standardError = Math.sqrt(1 / 12 / STATISTICS_DRAWS);

        expect(Math.abs(mean - 0.5)).toBeLessThan(5 * standardError);
    });

    it('fills 10 equal-width buckets within 5 standard errors of 2000 draws each', () => {
        // Each bucket count is binomial with n = 20000 and p = 0.1: mean 2000 and
        // standard error sqrt(20000 * 0.1 * 0.9) = 42.43; 5 standard errors = 212.13.
        const values = drawMany(createRng(STATISTICS_SEED), STATISTICS_DRAWS);
        const expected = STATISTICS_DRAWS * 0.1;
        const tolerance = 5 * Math.sqrt(STATISTICS_DRAWS * 0.1 * 0.9);

        for (let bucket = 0; bucket < 10; bucket += 1) {
            const count = values.filter((value) => Math.floor(value * 10) === bucket).length;

            expect(count, `bucket ${bucket}`).toBeGreaterThan(expected - tolerance);
            expect(count, `bucket ${bucket}`).toBeLessThan(expected + tolerance);
        }
    });
});

describe('[NFR-03] createRng input validation', () => {
    it.each([-1, 4294967296, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        'rejects the seed %s',
        (seed) => {
            expect(() => createRng(seed)).toThrow(SEED_RULE);
        }
    );

    it.each([0, 4294967295])('accepts the seed %s', (seed) => {
        expect(() => createRng(seed)).not.toThrow();
    });
});
