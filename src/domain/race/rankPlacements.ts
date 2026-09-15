import type { Placement, RoundSimulation } from './race.types';

export function rankPlacements(simulation: RoundSimulation): Placement[] {
    return simulation.runs
        .map((run) => ({
            run,
            finishTimeMs: run.checkpointsMs[run.checkpointsMs.length - 1] as number,
        }))
        .sort((a, b) => a.finishTimeMs - b.finishTimeMs || a.run.lane - b.run.lane)
        .map(({ run, finishTimeMs }, index) => ({
            position: index + 1,
            horseId: run.horseId,
            finishTimeMs,
        }));
}
