import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';

import { useRng } from '@/composables/useRng';
import { generateHorses, type Horse, type HorseId } from '@/domain';

export const useHorsesStore = defineStore('horses', () => {
    const rng = useRng();
    const horses = shallowRef<readonly Horse[]>(generateHorses(rng));
    const horsesById = computed<ReadonlyMap<HorseId, Horse>>(
        () => new Map(horses.value.map((horse) => [horse.id, horse]))
    );

    function generate(): void {
        horses.value = generateHorses(rng);
    }

    return { horses, horsesById, generate };
});
