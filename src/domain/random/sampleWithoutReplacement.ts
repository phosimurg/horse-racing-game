import type { Rng } from './random.types';
import { randomInt } from './randomInt';

export function sampleWithoutReplacement<T>(items: readonly T[], count: number, rng: Rng): T[] {
    if (!Number.isInteger(count) || count < 0 || count > items.length) {
        throw new Error(
            `sampleWithoutReplacement: count must be an integer from 0 to ${items.length}, received ${count}`
        );
    }
    const remaining = [...items];
    const sample: T[] = [];

    for (let drawn = 0; drawn < count; drawn += 1) {
        sample.push(...remaining.splice(randomInt(0, remaining.length - 1, rng), 1));
    }
    return sample;
}
