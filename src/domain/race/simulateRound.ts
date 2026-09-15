import type { Horse, HorseId } from '../horse/horse.types';
import type { Rng } from '../random/random.types';
import {
    BASE_SPEED_MPS,
    FORM_VARIANCE,
    MIN_CONDITION_FACTOR,
    PLAYBACK_SPEED,
    SEGMENT_JITTER,
    SEGMENT_LENGTH_M,
} from './race.constants';
import type { Round, RoundSimulation } from './race.types';

export function simulateRound(
    round: Round,
    horsesById: ReadonlyMap<HorseId, Horse>,
    rng: Rng
): RoundSimulation {
    const segmentCount = round.distance / SEGMENT_LENGTH_M;
    if (!Number.isInteger(segmentCount) || segmentCount <= 0) {
        throw new Error(
            `simulateRound: distance must be a positive multiple of ${SEGMENT_LENGTH_M} m, received ${round.distance}`
        );
    }
    if (round.horseIds.length === 0) {
        throw new Error(`simulateRound: round ${round.number} has no horses`);
    }
    const runs = round.horseIds.map((horseId, index) => ({
        horseId,
        lane: index + 1,
        checkpointsMs: simulateCheckpoints(conditionOf(horseId, horsesById), segmentCount, rng),
    }));

    return {
        round,
        runs,
        durationMs: Math.max(
            ...runs.map((run) => run.checkpointsMs[run.checkpointsMs.length - 1] as number)
        ),
    };
}

function conditionOf(horseId: HorseId, horsesById: ReadonlyMap<HorseId, Horse>): number {
    const horse = horsesById.get(horseId);
    if (!horse) {
        throw new Error(`simulateRound: horse ${horseId} is missing from horsesById`);
    }
    return horse.condition;
}

// Design 4.1: a uniform factor with the given spread, exactly 1 for a draw of 0.5.
function randomFactor(spread: number, rng: Rng): number {
    return 1 + spread * (2 * rng.next() - 1);
}

function simulateCheckpoints(condition: number, segmentCount: number, rng: Rng): number[] {
    const conditionFactor = MIN_CONDITION_FACTOR + ((1 - MIN_CONDITION_FACTOR) * condition) / 100;
    const form = randomFactor(FORM_VARIANCE, rng);
    let elapsedMs = 0;

    return Array.from({ length: segmentCount }, () => {
        const speedMps =
            BASE_SPEED_MPS * conditionFactor * form * randomFactor(SEGMENT_JITTER, rng);
        elapsedMs += ((SEGMENT_LENGTH_M / speedMps) * 1000) / PLAYBACK_SPEED;
        return elapsedMs;
    });
}
