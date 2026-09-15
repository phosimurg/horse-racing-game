import { createPinia, setActivePinia } from 'pinia';
import { createApp } from 'vue';

import { RNG_KEY } from '@/composables/useRng';
import { createRng } from '@/domain';
import { useHorsesStore } from '@/stores/horses';
import { useRaceStore } from '@/stores/race';

/** Builds Pinia stores inside an app that provides a generator seeded with `seed`. */
export function createTestStores({ seed = 1 }: { seed?: number } = {}) {
    const app = createApp({});
    const pinia = createPinia();
    app.use(pinia);
    app.provide(RNG_KEY, createRng(seed));
    setActivePinia(pinia);

    return { horses: useHorsesStore(pinia), race: useRaceStore(pinia) };
}
