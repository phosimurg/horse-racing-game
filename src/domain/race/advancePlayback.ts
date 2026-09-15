import { INTERMISSION_MS } from './race.constants';
import type { PlaybackState, PlaybackStep, RaceProgram, RoundSimulation } from './race.types';

export function advancePlayback(
    state: PlaybackState,
    deltaMs: number,
    program: RaceProgram
): PlaybackStep {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
        throw new Error(
            `advancePlayback: deltaMs must be a finite number of at least 0, received ${deltaMs}`
        );
    }
    if (!Number.isFinite(state.elapsedMs) || state.elapsedMs < 0) {
        throw new Error(
            `advancePlayback: state.elapsedMs must be a finite number of at least 0, received ${state.elapsedMs}`
        );
    }
    const current = simulationAt(program, state.roundIndex);
    if (state.phase === 'intermission' && isLastRound(program, state.roundIndex)) {
        throw new Error(
            `advancePlayback: round index ${state.roundIndex} is the last round and has no intermission`
        );
    }
    if (isLastRound(program, state.roundIndex) && state.elapsedMs >= current.durationMs) {
        return { state, completedRoundIndexes: [], isFinished: true };
    }
    return runTimeline(state, state.elapsedMs + deltaMs, program);
}

// Walks phase boundaries, carrying leftover time into the next phase.
function runTimeline(start: PlaybackState, elapsedMs: number, program: RaceProgram): PlaybackStep {
    const completedRoundIndexes: number[] = [];
    let { roundIndex, phase } = start;
    let phaseElapsedMs = elapsedMs;

    for (;;) {
        const phaseMs = phaseDurationMs(program, roundIndex, phase);
        if (phaseElapsedMs < phaseMs) {
            const state = { roundIndex, phase, elapsedMs: phaseElapsedMs };
            return { state, completedRoundIndexes, isFinished: false };
        }
        if (phase === 'intermission') {
            roundIndex += 1;
            phase = 'racing';
        } else {
            completedRoundIndexes.push(roundIndex);
            if (isLastRound(program, roundIndex)) {
                const state = { roundIndex, phase, elapsedMs: phaseMs };
                return { state, completedRoundIndexes, isFinished: true };
            }
            phase = 'intermission';
        }
        phaseElapsedMs -= phaseMs;
    }
}

function phaseDurationMs(
    program: RaceProgram,
    roundIndex: number,
    phase: PlaybackState['phase']
): number {
    return phase === 'racing' ? simulationAt(program, roundIndex).durationMs : INTERMISSION_MS;
}

function simulationAt(program: RaceProgram, roundIndex: number): RoundSimulation {
    const simulation = program.simulations[roundIndex];
    if (!simulation) {
        throw new Error(
            `advancePlayback: round index ${roundIndex} is outside the program's ${program.simulations.length} rounds`
        );
    }
    return simulation;
}

function isLastRound(program: RaceProgram, roundIndex: number): boolean {
    return roundIndex === program.simulations.length - 1;
}
