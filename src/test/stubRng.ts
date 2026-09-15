import type { Rng } from '@/domain';

/**
 * The largest value `createRng(seed).next()` can return: (2^32 - 1) / 2^32.
 * The `Rng` interface itself allows values up to 1 - 2^-53.
 */
export const LARGEST_DRAW = 4294967295 / 4294967296;

/** Returns `value` on every draw. */
export function constantRng(value: number): Rng {
    return { next: () => value };
}

/** Returns `values` in order and throws when they run out, proving the exact draw count. */
export function sequenceRng(values: readonly number[]): Rng {
    let drawn = 0;

    return {
        next: () => {
            const value = values[drawn];
            if (value === undefined) {
                throw new Error(`sequenceRng is exhausted after ${values.length} draws`);
            }
            drawn += 1;
            return value;
        },
    };
}
