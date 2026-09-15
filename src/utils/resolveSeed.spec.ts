import { describe, expect, it, vi } from 'vitest';

import { resolveSeed } from './resolveSeed';

const fallbackSeed = () => 777;

describe('[NFR-03] resolveSeed', () => {
    it.each([
        ['?seed=42', 42],
        ['?seed=0', 0],
        ['?seed=4294967295', 4294967295],
        ['?lap=2&seed=123', 123],
    ])('uses the decimal uint32 seed in %s', (search, seed) => {
        expect(resolveSeed(search, fallbackSeed)).toBe(seed);
    });

    it.each(['', '?seed=', '?seed=-1', '?seed=1.5', '?seed=4294967296', '?seed=abc', '?seed=0x10'])(
        'falls back to a random seed for %j',
        (search) => {
            expect(resolveSeed(search, fallbackSeed)).toBe(777);
        }
    );

    it('draws the default fallback from crypto.getRandomValues as an unsigned 32-bit number', () => {
        vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
            <T extends ArrayBufferView | null>(array: T): T => {
                if (array instanceof Uint32Array) {
                    array[0] = 3_000_000_000;
                }
                return array;
            }
        );

        expect(resolveSeed('')).toBe(3_000_000_000);
    });
});
