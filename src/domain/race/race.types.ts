import type { HorseId } from '../horse/horse.types';

export interface Round {
    readonly number: number;
    readonly distance: number;
    /** Lane n holds horseIds[n - 1]. */
    readonly horseIds: readonly HorseId[];
}

export interface HorseRun {
    readonly horseId: HorseId;
    readonly lane: number;
    /** Cumulative time at the end of each segment; the last entry is the finish time. */
    readonly checkpointsMs: readonly number[];
}

export interface RoundSimulation {
    readonly round: Round;
    readonly runs: readonly HorseRun[];
    readonly durationMs: number;
}

export interface RaceProgram {
    readonly rounds: readonly Round[];
    readonly simulations: readonly RoundSimulation[];
}

export interface Placement {
    readonly position: number;
    readonly horseId: HorseId;
    readonly finishTimeMs: number;
}

export interface RoundResult {
    readonly roundNumber: number;
    readonly distance: number;
    readonly placements: readonly Placement[];
}

export type RaceStatus = 'idle' | 'ready' | 'running' | 'paused' | 'finished';

export interface PlaybackState {
    readonly roundIndex: number;
    readonly phase: 'racing' | 'intermission';
    readonly elapsedMs: number;
}

export interface PlaybackStep {
    readonly state: PlaybackState;
    readonly completedRoundIndexes: readonly number[];
    readonly isFinished: boolean;
}
