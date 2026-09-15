import { describe, expect, it } from 'vitest';

import { generateHorses } from '../horse/generateHorses';
import type { HorseId } from '../horse/horse.types';
import { createRng } from '../random/createRng';
import { sampleWithoutReplacement } from '../random/sampleWithoutReplacement';
import type { HorseRun, RoundSimulation } from './race.types';
import { rankPlacements } from './rankPlacements';
import { simulateRound } from './simulateRound';

const SEEDS = [3, 42, 2026, 4294967295];
const ROUND_DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200];

function run(lane: number, horseId: HorseId, checkpointsMs: readonly number[]): HorseRun {
    return { horseId, lane, checkpointsMs };
}

function finishTimeOf(entry: HorseRun): number {
    return entry.checkpointsMs[entry.checkpointsMs.length - 1] ?? Number.NaN;
}

function ascending(values: readonly number[]): number[] {
    return [...values].sort((a, b) => a - b);
}

// A consistent simulation of runs listed in any order: 100 m per checkpoint, horseIds in lane order.
function simulationOf(runs: readonly HorseRun[]): RoundSimulation {
    return {
        round: {
            number: 1,
            distance: 100 * (runs[0]?.checkpointsMs.length ?? 0),
            horseIds: [...runs].sort((a, b) => a.lane - b.lane).map((entry) => entry.horseId),
        },
        runs,
        durationMs: Math.max(...runs.map(finishTimeOf)),
    };
}

// Freezes the simulation and everything in it, so any write throws a TypeError.
function frozen(simulation: RoundSimulation): RoundSimulation {
    return Object.freeze({
        round: Object.freeze({
            ...simulation.round,
            horseIds: Object.freeze([...simulation.round.horseIds]),
        }),
        runs: Object.freeze(
            simulation.runs.map((entry) =>
                Object.freeze({ ...entry, checkpointsMs: Object.freeze([...entry.checkpointsMs]) })
            )
        ),
        durationMs: simulation.durationMs,
    });
}

// Returns every pair of neighbors in which the later value is smaller or not a number.
function decreasingPairs(values: readonly number[]): number[][] {
    return values.slice(1).flatMap((value, index) => {
        const previous = values[index] ?? Number.NaN;

        return value >= previous ? [] : [[previous, value]];
    });
}

// For each seed: a roster, then 10 sampled horses and their simulation for each program distance.
function seededSimulations(): { seed: number; simulation: RoundSimulation }[] {
    return SEEDS.flatMap((seed) => {
        const rng = createRng(seed);
        const horses = generateHorses(rng);
        const horsesById = new Map(horses.map((horse) => [horse.id, horse]));

        return ROUND_DISTANCES.map((distance, index) => {
            const horseIds = sampleWithoutReplacement(horses, 10, rng).map((horse) => horse.id);
            const round = { number: index + 1, distance, horseIds };

            return { seed, simulation: simulateRound(round, horsesById, rng) };
        });
    });
}

// Horses 41 and 12 tie at 350 ms, and horses 27 and 5 tie at 400 ms. In both ties the higher lane
// has the lower horse id and the earlier first checkpoint, so only the lane decides.
const TIED_RUNS = [
    run(1, 27, [210, 400]),
    run(2, 5, [180, 400]),
    run(3, 41, [200, 350]),
    run(4, 12, [150, 350]),
];

describe('[RES-01] rankPlacements with hand-built runs', () => {
    it('ranks runs by their last checkpoint rather than lane, horse id or an earlier checkpoint', () => {
        // Lane  Horse  Checkpoints     Finish
        // 1     4      120, 240, 350   350
        // 2     9      115, 225, 320   320
        // 3     2      100, 220, 380   380
        // 4     15     110, 235, 330   330
        // Horse 2 leads at both earlier checkpoints, and lanes, ids and checkpoint sums (710, 660,
        // 700 and 675) give other orders, but placements follow the finishes 320, 330, 350, 380.
        const simulation = simulationOf([
            run(1, 4, [120, 240, 350]),
            run(2, 9, [115, 225, 320]),
            run(3, 2, [100, 220, 380]),
            run(4, 15, [110, 235, 330]),
        ]);

        expect(rankPlacements(simulation)).toEqual([
            { position: 1, horseId: 9, finishTimeMs: 320 },
            { position: 2, horseId: 15, finishTimeMs: 330 },
            { position: 3, horseId: 4, finishTimeMs: 350 },
            { position: 4, horseId: 2, finishTimeMs: 380 },
        ]);
    });

    it.each([
        { order: 'in lane order', runs: TIED_RUNS },
        { order: 'from the highest lane down', runs: [...TIED_RUNS].reverse() },
    ])('breaks exact finish-time ties by the lower lane with runs listed $order', ({ runs }) => {
        expect(rankPlacements(simulationOf(runs))).toEqual([
            { position: 1, horseId: 41, finishTimeMs: 350 },
            { position: 2, horseId: 12, finishTimeMs: 350 },
            { position: 3, horseId: 27, finishTimeMs: 400 },
            { position: 4, horseId: 5, finishTimeMs: 400 },
        ]);
    });

    it('ranks a simulation of two runs', () => {
        const simulation = simulationOf([run(1, 6, [300, 610]), run(2, 11, [320, 590])]);

        expect(rankPlacements(simulation)).toEqual([
            { position: 1, horseId: 11, finishTimeMs: 590 },
            { position: 2, horseId: 6, finishTimeMs: 610 },
        ]);
    });

    it('does not mutate the simulation', () => {
        // Runs listed out of finish order tempt an in-place sort, which throws on frozen arrays.
        const simulation = frozen(
            simulationOf([
                run(1, 4, [120, 240, 350]),
                run(2, 9, [115, 225, 320]),
                run(3, 2, [100, 220, 380]),
            ])
        );

        expect(() => rankPlacements(simulation)).not.toThrow();
    });
});

describe('[RES-01] rankPlacements over seeded simulated rounds', () => {
    it('assigns each position from 1 to the number of runs exactly once', () => {
        for (const { seed, simulation } of seededSimulations()) {
            const positions = rankPlacements(simulation).map((placement) => placement.position);

            expect(ascending(positions), `seed ${seed}, ${simulation.round.distance} m`).toEqual(
                Array.from({ length: simulation.runs.length }, (_, index) => index + 1)
            );
        }
    });

    it('never gives a better position a later finish time', () => {
        for (const { seed, simulation } of seededSimulations()) {
            const finishTimes = [...rankPlacements(simulation)]
                .sort((a, b) => a.position - b.position)
                .map((placement) => placement.finishTimeMs);

            expect(
                decreasingPairs(finishTimes),
                `seed ${seed}, ${simulation.round.distance} m`
            ).toEqual([]);
        }
    });

    it("places exactly the round's horses", () => {
        for (const { seed, simulation } of seededSimulations()) {
            const horseIds = rankPlacements(simulation).map((placement) => placement.horseId);

            expect(ascending(horseIds), `seed ${seed}, ${simulation.round.distance} m`).toEqual(
                ascending(simulation.round.horseIds)
            );
        }
    });

    it("reports each horse's last checkpoint as its finish time", () => {
        for (const { seed, simulation } of seededSimulations()) {
            const finishByHorse = new Map(
                simulation.runs.map((entry) => [entry.horseId, finishTimeOf(entry)])
            );
            const placements = rankPlacements(simulation);

            expect(
                placements.map(({ horseId, finishTimeMs }) => [horseId, finishTimeMs]),
                `seed ${seed}, ${simulation.round.distance} m`
            ).toEqual(placements.map(({ horseId }) => [horseId, finishByHorse.get(horseId)]));
        }
    });
});
