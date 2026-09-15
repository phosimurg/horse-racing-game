import { describe, expect, it } from 'vitest';

import { constantRng, LARGEST_DRAW, sequenceRng } from '@/test/stubRng';

import { createRng } from './createRng';
import { sampleWithoutReplacement } from './sampleWithoutReplacement';

const LETTERS: readonly string[] = ['a', 'b', 'c', 'd', 'e'];
const HORSE_IDS: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1);
const SEEDS = [1, 42, 2026, 4294967295];
const TRIALS = 4000;
const SAMPLE_SIZE = 10;

// Design 3.2: the message names the rule, so it mentions "count" and "integer".
const COUNT_RULE = /^(?=.*\bcount\b)(?=.*integer)/i;

function sampleTrials(seed: number): number[][] {
    const rng = createRng(seed);

    return Array.from({ length: TRIALS }, () =>
        sampleWithoutReplacement(HORSE_IDS, SAMPLE_SIZE, rng)
    );
}

describe('[NFR-03] sampleWithoutReplacement with a stubbed generator', () => {
    it('returns the first count entries in order when every draw is 0', () => {
        expect(sampleWithoutReplacement(LETTERS, 3, constantRng(0))).toEqual(['a', 'b', 'c']);
    });

    it('returns the last entries in reverse order when every draw is the largest', () => {
        expect(sampleWithoutReplacement(LETTERS, 3, constantRng(LARGEST_DRAW))).toEqual([
            'e',
            'd',
            'c',
        ]);
    });

    it('takes each entry at randomInt(0, remaining - 1) from the entries not drawn yet', () => {
        // draw   entries not drawn yet   index = floor(draw * remaining)   entry
        // 0.5    a b c d e               floor(2.5) = 2                    c
        // 0.75   a b d e                 floor(3) = 3                      e
        // 0.5    a b d                   floor(1.5) = 1                    b
        // 0.25   a d                     floor(0.5) = 0                    a
        const rng = sequenceRng([0.5, 0.75, 0.5, 0.25]);

        expect(sampleWithoutReplacement(LETTERS, 4, rng)).toEqual(['c', 'e', 'b', 'a']);
    });

    it.each([{ count: 1 }, { count: 3 }, { count: 5 }])(
        'consumes exactly one draw per entry for a count of $count',
        ({ count }) => {
            const rng = sequenceRng(Array.from({ length: count }, () => 0.5));

            sampleWithoutReplacement(LETTERS, count, rng);

            expect(() => rng.next()).toThrow(/exhausted/);
        }
    );

    it('returns an empty array without drawing when count is 0', () => {
        expect(sampleWithoutReplacement(LETTERS, 0, sequenceRng([]))).toEqual([]);
        expect(sampleWithoutReplacement([], 0, sequenceRng([]))).toEqual([]);
    });
});

describe('[NFR-03] sampleWithoutReplacement with a seeded generator', () => {
    it('returns count distinct entries of items for every count across fixed seeds', () => {
        for (const seed of SEEDS) {
            const rng = createRng(seed);

            for (let count = 0; count <= HORSE_IDS.length; count += 1) {
                const sample = sampleWithoutReplacement(HORSE_IDS, count, rng);

                expect(sample, `seed ${seed}, count ${count}`).toHaveLength(count);
                expect(new Set(sample).size, `seed ${seed}, count ${count}`).toBe(count);
                expect(HORSE_IDS, `seed ${seed}, count ${count}`).toEqual(
                    expect.arrayContaining(sample)
                );
            }
        }
    });

    it('returns a permutation of items when count equals items.length', () => {
        for (const seed of SEEDS) {
            const sample = sampleWithoutReplacement(HORSE_IDS, HORSE_IDS.length, createRng(seed));

            expect(
                [...sample].sort((a, b) => a - b),
                `seed ${seed}`
            ).toEqual(HORSE_IDS);
        }
    });

    it('never mutates items', () => {
        // Any write to a frozen array throws, so a mutating implementation fails the call.
        const items = Object.freeze([...HORSE_IDS]);

        for (const seed of SEEDS) {
            expect(
                () => sampleWithoutReplacement(items, items.length, createRng(seed)),
                `seed ${seed}`
            ).not.toThrow();
        }
    });
});

describe('[NFR-03] sampleWithoutReplacement distribution', () => {
    it('includes each item within 5 standard errors of count / items.length of the trials', () => {
        // Inclusion per trial is Bernoulli with p = 10 / 20 = 0.5. Over n = 4000 trials the count
        // has mean 2000 and standard error sqrt(4000 * 0.5 * 0.5) = 31.62; 5 standard errors = 158.11.
        const samples = sampleTrials(7);
        const probability = SAMPLE_SIZE / HORSE_IDS.length;
        const expected = TRIALS * probability;
        const tolerance = 5 * Math.sqrt(TRIALS * probability * (1 - probability));

        for (const id of HORSE_IDS) {
            const inclusions = samples.filter((sample) => sample.includes(id)).length;

            expect(inclusions, `item ${id}`).toBeGreaterThan(expected - tolerance);
            expect(inclusions, `item ${id}`).toBeLessThan(expected + tolerance);
        }
    });

    it('puts each item first within 5 standard errors of 1 / items.length of the trials', () => {
        // First place per trial is Bernoulli with p = 1 / 20 = 0.05. Over n = 4000 trials the count
        // has mean 200 and standard error sqrt(4000 * 0.05 * 0.95) = 13.78; 5 standard errors = 68.92.
        const samples = sampleTrials(8);
        const probability = 1 / HORSE_IDS.length;
        const expected = TRIALS * probability;
        const tolerance = 5 * Math.sqrt(TRIALS * probability * (1 - probability));

        for (const id of HORSE_IDS) {
            const firsts = samples.filter((sample) => sample[0] === id).length;

            expect(firsts, `item ${id}`).toBeGreaterThan(expected - tolerance);
            expect(firsts, `item ${id}`).toBeLessThan(expected + tolerance);
        }
    });
});

describe('[NFR-03] sampleWithoutReplacement input validation', () => {
    it.each([-1, 6, 2.5, Number.NaN])('rejects the count %s for 5 items', (count) => {
        expect(() => sampleWithoutReplacement(LETTERS, count, constantRng(0))).toThrow(COUNT_RULE);
    });

    it.each([0, 5])('accepts the count %s for 5 items', (count) => {
        expect(() => sampleWithoutReplacement(LETTERS, count, constantRng(0))).not.toThrow();
    });
});
