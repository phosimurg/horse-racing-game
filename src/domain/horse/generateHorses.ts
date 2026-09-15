import type { Rng } from '../random/random.types';
import { randomInt } from '../random/randomInt';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import {
    CONDITION_MAX,
    CONDITION_MIN,
    HORSE_COUNT,
    HORSE_NAMES,
    SILK_COLORS,
} from './horse.constants';
import type { Horse, HorseColor } from './horse.types';

export function generateHorses(rng: Rng): Horse[] {
    const names = sampleWithoutReplacement(HORSE_NAMES, HORSE_COUNT, rng);
    const colors = sampleWithoutReplacement(SILK_COLORS, HORSE_COUNT, rng);

    return names.map((name, index) => ({
        id: index + 1,
        name,
        // Both samples hold HORSE_COUNT entries, so every index has a color.
        color: colors[index] as HorseColor,
        condition: randomInt(CONDITION_MIN, CONDITION_MAX, rng),
    }));
}
