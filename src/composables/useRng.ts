import { inject, type InjectionKey } from 'vue';

import type { Rng } from '@/domain';

export const RNG_KEY: InjectionKey<Rng> = Symbol('rng');

export function useRng(): Rng {
    const rng = inject(RNG_KEY, null);
    if (!rng) {
        throw new Error(
            'useRng: no random number generator is provided; call app.provide(RNG_KEY, createRng(seed)) first'
        );
    }
    return rng;
}
