import type { Rng } from './random.types';

// A draw has 2^32 possible values, so a wider range cannot be sampled uniformly.
const MAX_RANGE_SIZE = 2 ** 32;

export function randomInt(min: number, max: number, rng: Rng): number {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        throw new Error(`randomInt: bounds must be safe integers, received ${min} and ${max}`);
    }
    if (min > max) {
        throw new Error(`randomInt: min must not be greater than max, received ${min} and ${max}`);
    }
    const rangeSize = max - min + 1;
    if (rangeSize > MAX_RANGE_SIZE) {
        throw new Error(
            `randomInt: range must hold at most 4294967296 integers, received ${min} to ${max}`
        );
    }
    return min + Math.floor(rng.next() * rangeSize);
}
