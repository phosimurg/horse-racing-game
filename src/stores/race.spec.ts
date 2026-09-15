import { describe, expect, it } from 'vitest';

import {
    createRng,
    generateHorses,
    generateProgram,
    rankPlacements,
    type RaceStatus,
} from '@/domain';
import { createTestStores } from '@/test/createTestStores';

type Stores = ReturnType<typeof createTestStores>;
type RaceStore = Stores['race'];
type Action = 'generateProgram' | 'start' | 'pause' | 'toggle' | 'completeRound';

const ACTIONS: Record<Action, (race: RaceStore) => void> = {
    generateProgram: (race) => race.generateProgram(),
    start: (race) => race.start(),
    pause: (race) => race.pause(),
    toggle: (race) => race.toggle(),
    completeRound: (race) => race.completeRound(race.results.length),
};

function storesIn(status: RaceStatus, seed = 42): Stores {
    const stores = createTestStores({ seed });
    const { race } = stores;
    if (status !== 'idle') {
        race.generateProgram();
    }
    if (status === 'running' || status === 'paused' || status === 'finished') {
        race.start();
    }
    if (status === 'paused') {
        race.pause();
    }
    if (status === 'finished') {
        for (let index = 0; index < 6; index += 1) {
            race.completeRound(index);
        }
    }
    return stores;
}

function snapshot({ race, horses }: Stores) {
    return {
        status: race.status,
        program: race.program,
        results: race.results,
        roster: horses.horses,
    };
}

describe('[CTRL-02] race store no-ops from the lifecycle table', () => {
    it.each([
        ['idle', 'start'],
        ['idle', 'pause'],
        ['idle', 'toggle'],
        ['idle', 'completeRound'],
        ['ready', 'pause'],
        ['ready', 'completeRound'],
        ['running', 'generateProgram'],
        ['running', 'start'],
        ['paused', 'generateProgram'],
        ['paused', 'pause'],
        ['paused', 'completeRound'],
        ['finished', 'start'],
        ['finished', 'pause'],
        ['finished', 'toggle'],
        ['finished', 'completeRound'],
    ] satisfies [RaceStatus, Action][])('%s ignores %s', (status, action) => {
        const stores = storesIn(status);
        const before = snapshot(stores);

        ACTIONS[action](stores.race);

        expect(snapshot(stores)).toEqual(before);
    });

    it('ignores a round reported out of order or twice', () => {
        const { race } = storesIn('running');

        race.completeRound(1);
        race.completeRound(0);
        race.completeRound(0);

        expect(race.results.map((result) => result.roundNumber)).toEqual([1]);
    });
});

describe('[CTRL-01] race control availability', () => {
    it.each([
        ['idle', false, true],
        ['ready', true, true],
        ['running', true, false],
        ['paused', true, false],
        ['finished', false, true],
    ] satisfies [RaceStatus, boolean, boolean][])(
        'in %s canStart is %s and canGenerate is %s',
        (status, canStart, canGenerate) => {
            const { race } = storesIn(status);

            expect({ canStart: race.canStart, canGenerate: race.canGenerate }).toEqual({
                canStart,
                canGenerate,
            });
        }
    );
});

describe('[RACE-03] race store start, pause and resume', () => {
    it.each([
        ['ready', 'start', 'running'],
        ['ready', 'toggle', 'running'],
        ['running', 'pause', 'paused'],
        ['running', 'toggle', 'paused'],
        ['paused', 'start', 'running'],
        ['paused', 'toggle', 'running'],
    ] satisfies [RaceStatus, Action, RaceStatus][])(
        '%s goes through %s to %s',
        (status, action, next) => {
            const stores = storesIn(status);
            const { program, results } = stores.race;

            ACTIONS[action](stores.race);

            expect(stores.race.status).toBe(next);
            expect(stores.race.program).toBe(program);
            expect(stores.race.results).toBe(results);
        }
    );
});

describe('[PROG-04] race store program generation', () => {
    it.each(['idle', 'ready', 'finished'] satisfies RaceStatus[])(
        'draws a new roster and program from %s, clears results and goes to ready',
        (status) => {
            const stores = storesIn(status);
            const before = snapshot(stores);

            stores.race.generateProgram();

            expect(stores.race.status).toBe('ready');
            expect(stores.race.results).toEqual([]);
            expect(stores.horses.horses).not.toEqual(before.roster);
            expect(stores.race.program).not.toEqual(before.program);
        }
    );

    it('builds the program from the new roster with the injected generator', () => {
        const { race, horses } = createTestStores({ seed: 42 });
        const rng = createRng(42);
        generateHorses(rng);
        const roster = generateHorses(rng);

        race.generateProgram();

        expect(horses.horses).toEqual(roster);
        expect(race.program).toEqual(generateProgram(roster, rng));
    });
});

describe('[RES-01] race store results', () => {
    it('appends each completed round with its placements, in order', () => {
        const { race } = storesIn('running');

        race.completeRound(0);
        race.completeRound(1);

        const simulations = race.program?.simulations.slice(0, 2) ?? [];
        expect(race.results).toEqual(
            simulations.map((simulation) => ({
                roundNumber: simulation.round.number,
                distance: simulation.round.distance,
                placements: rankPlacements(simulation),
            }))
        );
        expect(race.status).toBe('running');
    });
});

describe('[RES-02] race store finish', () => {
    it('stays running through round 5 and finishes when round 6 completes', () => {
        const { race } = storesIn('running');

        for (let index = 0; index < 5; index += 1) {
            race.completeRound(index);
        }
        expect(race.status).toBe('running');

        race.completeRound(5);

        expect(race.status).toBe('finished');
        expect(race.results.map((result) => result.roundNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    });
});

describe('[NFR-03] race store determinism', () => {
    it('gives identical rosters, programs and results for the same seed and actions', () => {
        expect(snapshot(storesIn('finished', 2026))).toEqual(snapshot(storesIn('finished', 2026)));
    });
});
