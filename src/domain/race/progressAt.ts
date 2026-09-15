import type { HorseRun } from './race.types';

export function progressAt(run: HorseRun, elapsedMs: number): number {
    const { checkpointsMs } = run;
    let segmentStartMs = 0;

    for (const [index, checkpointMs] of checkpointsMs.entries()) {
        if (elapsedMs < checkpointMs) {
            const segmentProgress = (elapsedMs - segmentStartMs) / (checkpointMs - segmentStartMs);
            return Math.max(0, (index + segmentProgress) / checkpointsMs.length);
        }
        segmentStartMs = checkpointMs;
    }
    return 1;
}
