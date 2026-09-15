import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { progressAt, rankPlacements, type RoundSimulation } from '@/domain';
import { stubAnimationFrames } from '@/test/animationFrames';
import { createTestStores } from '@/test/createTestStores';

import { useRacePlayback } from './useRacePlayback';

type Playback = ReturnType<typeof useRacePlayback>;

afterEach(() => {
    vi.unstubAllGlobals();
});

function setup({ generate = true } = {}) {
    const frames = stubAnimationFrames();
    const stores = createTestStores({ seed: 42 });
    if (generate) {
        stores.race.generateProgram();
    }
    const scope = effectScope();
    const playback = scope.run(() => useRacePlayback()) as Playback;
    return { frames, race: stores.race, scope, playback };
}

function progressOf(simulation: RoundSimulation, elapsedMs: number) {
    return new Map(simulation.runs.map((run) => [run.horseId, progressAt(run, elapsedMs)]));
}

function runUntil(frames: ReturnType<typeof stubAnimationFrames>, done: () => boolean) {
    let timestamp = 0;
    for (let frame = 0; frame < 5000 && !done(); frame += 1) {
        frames.frame(timestamp);
        timestamp += 100;
    }
}

describe('[RACE-02] useRacePlayback track state', () => {
    it('shows round 1 at the start gate with no leader before the start', () => {
        const { race, playback } = setup();

        expect(playback.activeRound.value).toBe(race.program?.rounds[0]);
        expect(playback.phase.value).toBe('racing');
        expect([...playback.progressByHorseId.value.values()]).toEqual(
            Array.from({ length: 10 }, () => 0)
        );
        expect(playback.leaderId.value).toBeNull();
    });

    it('shows an empty track while no program exists', () => {
        const { playback } = setup({ generate: false });

        expect(playback.activeRound.value).toBeNull();
        expect(playback.progressByHorseId.value.size).toBe(0);
        expect(playback.leaderId.value).toBeNull();
    });

    it('names the horse with the most progress while racing, ties by finish order', () => {
        const { race, frames, playback } = setup();
        race.start();
        frames.frame(1000);
        frames.frame(1100);
        frames.frame(1200);

        const simulation = race.program?.simulations[0] as RoundSimulation;
        const progress = playback.progressByHorseId.value;
        const best = Math.max(...progress.values());
        const expected = rankPlacements(simulation).find(
            ({ horseId }) => progress.get(horseId) === best
        );

        expect(best).toBeGreaterThan(0);
        expect(playback.leaderId.value).toBe(expected?.horseId);
    });

    it('holds every horse at the line and names the winner during the intermission', () => {
        const { race, frames, playback } = setup();
        race.start();

        runUntil(frames, () => race.results.length === 1);

        expect(playback.phase.value).toBe('intermission');
        expect([...playback.progressByHorseId.value.values()].every((value) => value === 1)).toBe(
            true
        );
        expect(playback.leaderId.value).toBe(race.results[0]?.placements[0]?.horseId);
    });
});

describe('[RACE-01] useRacePlayback running rounds', () => {
    it('moves each horse in proportion to its simulated progress', () => {
        const { race, frames, playback } = setup();
        race.start();
        frames.frame(1000);
        frames.frame(1016);
        frames.frame(1049);

        expect(playback.progressByHorseId.value).toEqual(
            progressOf(race.program?.simulations[0] as RoundSimulation, 49)
        );
    });

    it('runs the six rounds in order with an intermission between rounds', () => {
        const { race, frames, playback } = setup();
        const phases: string[] = [];
        race.start();

        let timestamp = 0;
        for (let frame = 0; frame < 5000 && race.status === 'running'; frame += 1) {
            frames.frame(timestamp);
            timestamp += 100;
            if (phases[phases.length - 1] !== playback.phase.value) {
                phases.push(playback.phase.value);
            }
        }

        expect(race.results.map((result) => result.roundNumber)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(phases).toEqual([
            'racing',
            'intermission',
            'racing',
            'intermission',
            'racing',
            'intermission',
            'racing',
            'intermission',
            'racing',
            'intermission',
            'racing',
        ]);
    });
});

describe('[RACE-05] useRacePlayback delayed frames', () => {
    it('advances a delayed frame by at most MAX_FRAME_DELTA_MS', () => {
        const { race, frames, playback } = setup();
        race.start();
        frames.frame(1000);
        frames.frame(61000);

        expect(playback.progressByHorseId.value).toEqual(
            progressOf(race.program?.simulations[0] as RoundSimulation, 100)
        );
    });
});

describe('[RACE-03] useRacePlayback pause and resume', () => {
    it('freezes positions while paused and resumes from the frozen state', () => {
        const { race, frames, playback } = setup();
        const simulation = () => race.program?.simulations[0] as RoundSimulation;
        race.start();
        frames.frame(1000);
        frames.frame(1080);

        race.pause();
        frames.frame(9000);

        expect(frames.pendingCount()).toBe(0);
        expect(playback.progressByHorseId.value).toEqual(progressOf(simulation(), 80));

        race.start();
        frames.frame(20000);
        frames.frame(20016);

        expect(playback.progressByHorseId.value).toEqual(progressOf(simulation(), 96));
    });

    it('stops requesting frames when its scope is disposed', () => {
        const { race, frames, scope } = setup();
        race.start();

        scope.stop();

        expect(frames.pendingCount()).toBe(0);
    });
});

describe('[RES-02] useRacePlayback at the finish', () => {
    it('keeps round 6 at the line with its winner once the race finishes', () => {
        const { race, frames, playback } = setup();
        race.start();

        runUntil(frames, () => race.status === 'finished');

        expect(race.status).toBe('finished');
        expect(frames.pendingCount()).toBe(0);
        expect(playback.activeRound.value).toBe(race.program?.rounds[5]);
        expect([...playback.progressByHorseId.value.values()].every((value) => value === 1)).toBe(
            true
        );
        expect(playback.leaderId.value).toBe(race.results[5]?.placements[0]?.horseId);
    });

    it('returns to round 1 at the start gate when a new program is generated', () => {
        const { race, frames, playback } = setup();
        race.start();
        runUntil(frames, () => race.status === 'finished');

        race.generateProgram();

        expect(playback.activeRound.value).toBe(race.program?.rounds[0]);
        expect([...playback.progressByHorseId.value.values()].every((value) => value === 0)).toBe(
            true
        );
        expect(playback.leaderId.value).toBeNull();
    });
});
