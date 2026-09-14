import { describe, expect, it } from 'vitest';

import { constantRng, LARGEST_DRAW, sequenceRng } from '@/test/stubRng';

import { createRng } from './createRng';
import type { Rng } from './random.types';
import { randomInt } from './randomInt';

const DIE_ROLLS = 12000;

// Design 3.2: each message names its rule.
const SAFE_INTEGER_RULE = /safe[\s-]integer/i;
// Names both bounds and how they compare, for example "min must not be greater than max".
const ORDER_RULE = /^(?=.*\bmin\b)(?=.*\bmax\b)(?=.*(?:greater|less|exceed|[<>]))/i;
// Names the range limit, for example "range must hold at most 4294967296 integers".
const RANGE_RULE = /^(?=.*\brange\b)(?=.*4294967296)/i;

function drawIntegers(rng: Rng, min: number, max: number, count: number): number[] {
    return Array.from({ length: count }, () => randomInt(min, max, rng));
}

describe('[NFR-03] randomInt with a stubbed generator', () => {
    it.each([
        { min: 3, max: 9 },
        { min: -10, max: -4 },
    ])('returns min for a draw of 0 with min $min and max $max', ({ min, max }) => {
        expect(randomInt(min, max, constantRng(0))).toBe(min);
    });

    it.each([
        { min: 3, max: 9 },
        { min: -10, max: -4 },
    ])('returns max for the largest draw with min $min and max $max', ({ min, max }) => {
        expect(randomInt(min, max, constantRng(LARGEST_DRAW))).toBe(max);
    });

    // Rows are [min, max, draw, expected] with expected = min + floor(draw * (max - min + 1)).
    it.each([
        [1, 6, 0.4375, 3], // 1 + floor(2.625)
        [1, 6, 0.875, 6], // 1 + floor(5.25)
        [-3, 3, 0.5, 0], // -3 + floor(3.5)
        [-10, -4, 0.625, -6], // -10 + floor(4.375)
    ])('maps min %s, max %s and a draw of %s to %s', (min, max, draw, expected) => {
        expect(randomInt(min, max, constantRng(draw))).toBe(expected);
    });

    it('returns the bound when min equals max', () => {
        expect(randomInt(7, 7, constantRng(0))).toBe(7);
        expect(randomInt(7, 7, constantRng(LARGEST_DRAW))).toBe(7);
    });

    it.each([
        { min: 1, max: 6 },
        { min: 7, max: 7 },
    ])('consumes exactly one draw with min $min and max $max', ({ min, max }) => {
        const rng = sequenceRng([0.5]);

        randomInt(min, max, rng);

        expect(() => rng.next()).toThrow(/exhausted/);
    });
});

describe('[NFR-03] randomInt with a seeded generator', () => {
    it('returns integers from min to max inclusive across fixed seeds', () => {
        const values = [1, 42, 4294967295].flatMap((seed) =>
            drawIntegers(createRng(seed), -5, 5, 5000)
        );

        expect(
            values.filter((value) => !Number.isInteger(value) || value < -5 || value > 5)
        ).toEqual([]);
    });

    it('reaches both bounds', () => {
        const values = drawIntegers(createRng(42), -5, 5, 5000);

        expect(values).toContain(-5);
        expect(values).toContain(5);
    });

    it('rolls each face of a die within 5 standard errors of one sixth of the rolls', () => {
        // Each face count is binomial with n = 12000 and p = 1/6: mean 2000 and
        // standard error sqrt(12000 * 1/6 * 5/6) = 40.82; 5 standard errors = 204.12.
        const rolls = drawIntegers(createRng(2026), 1, 6, DIE_ROLLS);
        const expected = DIE_ROLLS / 6;
        const tolerance = 5 * Math.sqrt(DIE_ROLLS * (1 / 6) * (5 / 6));

        for (const face of [1, 2, 3, 4, 5, 6]) {
            const count = rolls.filter((roll) => roll === face).length;

            expect(count, `face ${face}`).toBeGreaterThan(expected - tolerance);
            expect(count, `face ${face}`).toBeLessThan(expected + tolerance);
        }
    });
});

describe('[NFR-03] randomInt input validation', () => {
    it.each([
        { min: 1.5, max: 6 },
        { min: 1, max: 6.5 },
        { min: Number.NaN, max: 6 },
        { min: 1, max: Number.NaN },
        { min: Number.NEGATIVE_INFINITY, max: 6 },
        { min: 1, max: Number.POSITIVE_INFINITY },
        { min: -(2 ** 53), max: 6 },
        { min: 1, max: 2 ** 53 },
    ])('rejects min $min and max $max because a bound is not a safe integer', ({ min, max }) => {
        const call = () => randomInt(min, max, constantRng(0));

        expect(call).toThrow(SAFE_INTEGER_RULE);
        expect(call).not.toThrow(RANGE_RULE);
    });

    it.each([
        { min: 2, max: 1 },
        { min: -4, max: -10 },
    ])('rejects min $min greater than max $max', ({ min, max }) => {
        const call = () => randomInt(min, max, constantRng(0));

        expect(call).toThrow(ORDER_RULE);
        expect(call).not.toThrow(RANGE_RULE);
    });

    // max - min + 1 is 2^32 + 1 in the first two rows and 2^54 - 1 in the widest safe range.
    it.each([
        [0, 4294967296],
        [-2147483648, 2147483648],
        [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    ])('rejects min %s and max %s because the range holds more than 2^32 integers', (min, max) => {
        const call = () => randomInt(min, max, constantRng(0));

        expect(call).toThrow(RANGE_RULE);
        expect(call).not.toThrow(SAFE_INTEGER_RULE);
        expect(call).not.toThrow(ORDER_RULE);
    });

    it('accepts min equal to max', () => {
        expect(() => randomInt(4, 4, constantRng(0))).not.toThrow();
    });

    it('accepts the safe integer limits as bounds', () => {
        expect(
            randomInt(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER + 10, constantRng(0))
        ).toBe(Number.MIN_SAFE_INTEGER);
        expect(
            randomInt(
                Number.MAX_SAFE_INTEGER - 10,
                Number.MAX_SAFE_INTEGER,
                constantRng(LARGEST_DRAW)
            )
        ).toBe(Number.MAX_SAFE_INTEGER);
    });

    // Rows are [min, max, draw, expected]; each range holds exactly 2^32 integers.
    it.each([
        [0, 4294967295, LARGEST_DRAW, 4294967295], // floor((2^32 - 1) / 2^32 * 2^32)
        [0, 4294967295, 0.5, 2147483648], // floor(0.5 * 2^32)
        [-2147483648, 2147483647, 0, -2147483648], // -2^31 + floor(0 * 2^32)
    ])(
        'accepts a range of exactly 2^32 integers: min %s, max %s and a draw of %s give %s',
        (min, max, draw, expected) => {
            expect(randomInt(min, max, constantRng(draw))).toBe(expected);
        }
    );
});
