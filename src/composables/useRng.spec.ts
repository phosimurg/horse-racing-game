import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import { createRng, type Rng } from '@/domain';

import { RNG_KEY, useRng } from './useRng';

function useRngInApp(provided?: Rng): Rng {
    const app = createApp({});
    if (provided) {
        app.provide(RNG_KEY, provided);
    }
    return app.runWithContext(() => useRng());
}

describe('[NFR-03] useRng', () => {
    it('returns the generator provided to the app', () => {
        const rng = createRng(42);

        expect(useRngInApp(rng)).toBe(rng);
    });

    it('throws a descriptive error when no generator is provided', () => {
        expect(() => useRngInApp()).toThrow(/^useRng: no random number generator/);
    });
});
