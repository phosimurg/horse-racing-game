import type { Rng } from './random.types';

const UINT32_RANGE = 2 ** 32;

export function createRng(seed: number): Rng {
    if (!Number.isInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
        throw new Error(
            `createRng: seed must be an integer from 0 to 4294967295, received ${seed}`
        );
    }
    let state = seed | 0;

    return {
        // mulberry32: a Weyl-sequence state mixed by two multiply-xorshift rounds.
        next() {
            state = (state + 0x6d2b79f5) | 0;
            let output = Math.imul(state ^ (state >>> 15), state | 1);
            output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
            return ((output ^ (output >>> 14)) >>> 0) / UINT32_RANGE;
        },
    };
}
