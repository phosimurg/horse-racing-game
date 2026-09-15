import { describe, expect, it } from 'vitest';

import { createRng, generateHorses } from '@/domain';
import { createTestStores } from '@/test/createTestStores';

describe('[HORSE-04] horses store', () => {
    it('draws the roster from the injected generator when the store is created', () => {
        const { horses } = createTestStores({ seed: 42 });

        expect(horses.horses).toEqual(generateHorses(createRng(42)));
    });

    it('draws a new roster from the next draws on generate', () => {
        const { horses } = createTestStores({ seed: 42 });
        const rng = createRng(42);
        const firstRoster = generateHorses(rng);

        horses.generate();

        expect(horses.horses).toEqual(generateHorses(rng));
        expect(horses.horses).not.toEqual(firstRoster);
    });

    it('indexes the current roster by id', () => {
        const { horses } = createTestStores({ seed: 7 });
        horses.generate();

        expect([...horses.horsesById.keys()]).toEqual(horses.horses.map((horse) => horse.id));
        expect(horses.horses.every((horse) => horses.horsesById.get(horse.id) === horse)).toBe(
            true
        );
    });
});
