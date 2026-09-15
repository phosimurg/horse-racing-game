import { describe, expect, it } from 'vitest';

import { advancePlayback } from './advancePlayback';
import { progressAt } from './progressAt';
import type { PlaybackState, RaceProgram } from './race.types';

// Design 4.2.
const INTERMISSION_MS = 1500;

// Design 3.2: each message starts with the function name and names its rule.
const DELTA_RULE = /^advancePlayback:(?=.*\bdeltaMs\b)(?=.*(?:negative|finite))/i;
const ROUND_INDEX_RULE =
    /^advancePlayback:(?=.*round ?[Ii]ndex)(?=.*(?:outside|within|range|bounds|integer|program))/i;

// A minimal RaceProgram with one round per entry of `durations`, each holding a single horse
// whose only checkpoint is that round's durationMs.
function programOf(durations: readonly number[]): RaceProgram {
    const entries = durations.map((durationMs, index) => {
        const round = { number: index + 1, distance: 1200, horseIds: [1] };
        const simulation = {
            round,
            runs: [{ horseId: 1, lane: 1, checkpointsMs: [durationMs] }],
            durationMs,
        };

        return { round, simulation };
    });

    return {
        rounds: entries.map((entry) => entry.round),
        simulations: entries.map((entry) => entry.simulation),
    };
}

function stateOf(
    roundIndex: number,
    phase: PlaybackState['phase'],
    elapsedMs: number
): PlaybackState {
    return { roundIndex, phase, elapsedMs };
}

// Cycles `sizes` and stops once the next size would overshoot `total`, then appends one final
// frame for the remainder so the frames sum to exactly `total`.
function alternatingFrames(sizes: readonly number[], total: number): number[] {
    const minSize = Math.min(...sizes);
    const upperBound = Math.ceil(total / minSize) + sizes.length;
    const cycle = Array.from(
        { length: upperBound },
        (_, index) => sizes[index % sizes.length] ?? 0
    );

    const frames: number[] = [];
    let sum = 0;
    for (const size of cycle) {
        if (sum + size > total) {
            break;
        }
        frames.push(size);
        sum += size;
    }
    if (sum < total) {
        frames.push(total - sum);
    }
    return frames;
}

// The absolute time since the program started (round 0, racing, 0 ms) that `state` represents:
// every earlier round's full racing time and intermission, plus the current round's racing time
// when already in its intermission, plus the elapsed time of the current phase.
function timelineOffset(program: RaceProgram, state: PlaybackState): number {
    let offset = 0;
    for (let index = 0; index < state.roundIndex; index += 1) {
        offset += (program.simulations[index]?.durationMs ?? 0) + INTERMISSION_MS;
    }
    if (state.phase === 'intermission') {
        offset += program.simulations[state.roundIndex]?.durationMs ?? 0;
    }
    return offset + state.elapsedMs;
}

function applySequence(
    start: PlaybackState,
    deltas: readonly number[],
    program: RaceProgram
): { state: PlaybackState; completed: number[] } {
    let state = start;
    const completed: number[] = [];

    for (const delta of deltas) {
        const step = advancePlayback(state, delta, program);
        completed.push(...step.completedRoundIndexes);
        state = step.state;
    }
    return { state, completed };
}

describe('[RACE-01] advancePlayback rounds run in order', () => {
    it('completes round 0 exactly when its elapsed time reaches durationMs, reported once', () => {
        const program = programOf([1000, 2000, 3000]);

        const step = advancePlayback(stateOf(0, 'racing', 0), 1000, program);

        expect(step.completedRoundIndexes).toEqual([0]);
        expect(step.state).toEqual({ roundIndex: 0, phase: 'intermission', elapsedMs: 0 });
        expect(step.isFinished).toBe(false);
    });

    it('starts the next round racing after the intermission elapses', () => {
        const program = programOf([1000, 2000, 3000]);

        const step = advancePlayback(stateOf(0, 'intermission', 0), INTERMISSION_MS, program);

        expect(step.completedRoundIndexes).toEqual([]);
        expect(step.state).toEqual({ roundIndex: 1, phase: 'racing', elapsedMs: 0 });
        expect(step.isFinished).toBe(false);
    });

    it('carries leftover time across the racing-to-intermission boundary', () => {
        // Design 5.2 worked example: {round 0, racing, 900} + 700 ms with a 1000 ms round
        // completes round 0 (900 + 700 - 1000 = 600 ms leftover) 600 ms into the intermission.
        const program = programOf([1000, 2000, 3000]);

        const step = advancePlayback(stateOf(0, 'racing', 900), 700, program);

        expect(step.completedRoundIndexes).toEqual([0]);
        expect(step.state).toEqual({ roundIndex: 0, phase: 'intermission', elapsedMs: 600 });
        expect(step.isFinished).toBe(false);
    });

    it('reports every round crossed by one large delta, in order, and keeps racing the current round', () => {
        const program = programOf([1000, 2000, 3000]);
        // 1000 (round 0) + 1500 (intermission) + 2000 (round 1) + 1500 (intermission) + 500 into
        // round 2's racing phase.
        const delta = 1000 + INTERMISSION_MS + 2000 + INTERMISSION_MS + 500;

        const step = advancePlayback(stateOf(0, 'racing', 0), delta, program);

        expect(step.completedRoundIndexes).toEqual([0, 1]);
        expect(step.state).toEqual({ roundIndex: 2, phase: 'racing', elapsedMs: 500 });
        expect(step.isFinished).toBe(false);
    });
});

describe('[RACE-03] advancePlayback with a zero delta', () => {
    it.each([
        { phase: 'racing' as const, elapsedMs: 400 },
        { phase: 'intermission' as const, elapsedMs: 300 },
    ])('returns the same state and no completions while $phase', ({ phase, elapsedMs }) => {
        const program = programOf([1000, 2000, 3000]);
        const state = stateOf(1, phase, elapsedMs);

        const step = advancePlayback(state, 0, program);

        expect(step.state).toEqual(state);
        expect(step.completedRoundIndexes).toEqual([]);
        expect(step.isFinished).toBe(false);
    });
});

describe('[RACE-03] advancePlayback pausing', () => {
    it('gives the same outcome whether or not zero deltas are inserted between real ones', () => {
        const program = programOf([1000, 2000, 3000]);
        const start = stateOf(0, 'racing', 0);
        const withoutPauses = [400, 700, 1500, 900, 1100];
        const withPauses = [0, 400, 0, 0, 700, 1500, 0, 900, 1100, 0];

        const plain = applySequence(start, withoutPauses, program);
        const paused = applySequence(start, withPauses, program);

        expect(paused.state).toEqual(plain.state);
        expect(paused.completed).toEqual(plain.completed);
    });
});

describe('[RACE-05] advancePlayback frame-rate independence', () => {
    it.each([
        { label: 'alternating 16 and 17 ms frames', sizes: [16, 17] },
        // 100 ms is MAX_FRAME_DELTA_MS, the largest single frame the playback loop ever passes.
        { label: '100 ms frames', sizes: [100] },
    ])('matches one big step of the same total with $label', ({ sizes }) => {
        const program = programOf([1000, 2000, 3000]);
        const start = stateOf(0, 'racing', 0);
        const total = 5000;

        const bigStep = advancePlayback(start, total, program);
        const { state, completed } = applySequence(start, alternatingFrames(sizes, total), program);

        expect(state.roundIndex).toBe(bigStep.state.roundIndex);
        expect(state.phase).toBe(bigStep.state.phase);
        expect(state.elapsedMs).toBeCloseTo(bigStep.state.elapsedMs, 6);
        expect(completed).toEqual(bigStep.completedRoundIndexes);
    });
});

describe('[RACE-05] advancePlayback time conservation', () => {
    it('conserves time: completed durations, their intermissions and the current elapsed sum to the deltas', () => {
        const program = programOf([1000, 2000, 3000]);
        const deltas = [300, 1200, 250, 1900, 800, 200];

        const { state } = applySequence(stateOf(0, 'racing', 0), deltas, program);
        const totalDeltas = deltas.reduce((sum, delta) => sum + delta, 0);

        expect(timelineOffset(program, state)).toBeCloseTo(totalDeltas, 6);
    });
});

describe('[RES-02] advancePlayback at the end of the race', () => {
    it('finishes when the last round completes, holding the state at its durationMs', () => {
        const program = programOf([1000, 1500]);

        const step = advancePlayback(stateOf(1, 'racing', 1400), 100, program);

        expect(step.completedRoundIndexes).toEqual([1]);
        expect(step.isFinished).toBe(true);
        expect(step.state).toEqual({ roundIndex: 1, phase: 'racing', elapsedMs: 1500 });
    });

    it('discards leftover time beyond the last round instead of starting an intermission', () => {
        const program = programOf([1000, 1500]);

        const step = advancePlayback(stateOf(1, 'racing', 1400), 250, program);

        expect(step.completedRoundIndexes).toEqual([1]);
        expect(step.isFinished).toBe(true);
        expect(step.state).toEqual({ roundIndex: 1, phase: 'racing', elapsedMs: 1500 });
    });

    it('returns a finished state unchanged, with no further completions', () => {
        const program = programOf([1000, 1500]);
        const finished = stateOf(1, 'racing', 1500);

        const step = advancePlayback(finished, 400, program);

        expect(step.state).toEqual(finished);
        expect(step.completedRoundIndexes).toEqual([]);
        expect(step.isFinished).toBe(true);
    });

    it('reaches progress 1 for every run of the last round at the finished elapsed time', () => {
        const program = programOf([1000, 1500]);

        const step = advancePlayback(stateOf(1, 'racing', 1400), 100, program);
        const lastSimulation = program.simulations[program.simulations.length - 1];

        expect(lastSimulation).toBeDefined();
        for (const run of lastSimulation?.runs ?? []) {
            expect(progressAt(run, step.state.elapsedMs)).toBe(1);
        }
    });
});

describe('[RACE-01] advancePlayback input validation', () => {
    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects a deltaMs of %s', (deltaMs) => {
        const program = programOf([1000, 2000]);
        const call = () => advancePlayback(stateOf(0, 'racing', 0), deltaMs, program);

        expect(call).toThrow(DELTA_RULE);
        expect(call).not.toThrow(ROUND_INDEX_RULE);
    });

    // A 2-round program: -1 is negative, 2 equals the round count, and 0.5 is not an integer.
    it.each([-1, 2, 0.5])('rejects a state whose round index is %s', (roundIndex) => {
        const program = programOf([1000, 2000]);
        const call = () => advancePlayback(stateOf(roundIndex, 'racing', 0), 0, program);

        expect(call).toThrow(ROUND_INDEX_RULE);
        expect(call).not.toThrow(DELTA_RULE);
    });

    it('rejects a program with no simulations', () => {
        const program = programOf([]);
        const call = () => advancePlayback(stateOf(0, 'racing', 0), 0, program);

        expect(call).toThrow(ROUND_INDEX_RULE);
        expect(call).not.toThrow(DELTA_RULE);
    });
});
