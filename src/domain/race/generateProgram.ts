import type { Horse, HorseId } from '../horse/horse.types';
import type { Rng } from '../random/random.types';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import { HORSES_PER_ROUND, ROUND_DISTANCES_M } from './race.constants';
import type { RaceProgram, Round } from './race.types';
import { simulateRound } from './simulateRound';

export function generateProgram(horses: readonly Horse[], rng: Rng): RaceProgram {
    if (horses.length < HORSES_PER_ROUND) {
        throw new Error(
            `generateProgram: a program needs at least ${HORSES_PER_ROUND} horses, received ${horses.length}`
        );
    }
    const horsesById = new Map<HorseId, Horse>(horses.map((horse) => [horse.id, horse]));
    if (horsesById.size !== horses.length) {
        throw new Error('generateProgram: every horse id must be unique, found a duplicate');
    }
    const rounds: Round[] = ROUND_DISTANCES_M.map((distance, index) => ({
        number: index + 1,
        distance,
        horseIds: sampleWithoutReplacement(horses, HORSES_PER_ROUND, rng).map((horse) => horse.id),
    }));

    return { rounds, simulations: rounds.map((round) => simulateRound(round, horsesById, rng)) };
}
