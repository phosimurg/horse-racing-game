import { computed, shallowRef, watch } from 'vue';

import {
    advancePlayback,
    progressAt,
    rankPlacements,
    type HorseId,
    type PlaybackState,
    type RaceProgram,
} from '@/domain';
import { useRaceStore } from '@/stores/race';

import { useAnimationFrame } from './useAnimationFrame';

const START_STATE: PlaybackState = { roundIndex: 0, phase: 'racing', elapsedMs: 0 };

export function useRacePlayback() {
    const race = useRaceStore();
    const state = shallowRef<PlaybackState>(START_STATE);

    const frames = useAnimationFrame((deltaMs) => {
        // Frames run only while the race is running, which requires a program.
        const step = advancePlayback(state.value, deltaMs, race.program as RaceProgram);
        state.value = step.state;
        for (const roundIndex of step.completedRoundIndexes) {
            race.completeRound(roundIndex);
        }
    });

    watch(
        () => race.program,
        () => {
            state.value = START_STATE;
        },
        { flush: 'sync' }
    );
    watch(
        () => race.status,
        (status) => {
            if (status === 'running') {
                frames.start();
            } else {
                frames.stop();
            }
        },
        { flush: 'sync', immediate: true }
    );

    const activeSimulation = computed(
        () => race.program?.simulations[state.value.roundIndex] ?? null
    );
    const activeRound = computed(() => activeSimulation.value?.round ?? null);
    const phase = computed(() => state.value.phase);
    const progressByHorseId = computed<ReadonlyMap<HorseId, number>>(() => {
        const { phase: currentPhase, elapsedMs } = state.value;
        const runs = activeSimulation.value?.runs ?? [];
        return new Map(
            runs.map((run) => [
                run.horseId,
                currentPhase === 'intermission' ? 1 : progressAt(run, elapsedMs),
            ])
        );
    });
    // Design 5.2: no leader before a horse moves; ties go to the earlier finish, then the lane.
    const leaderId = computed<HorseId | null>(() => {
        const simulation = activeSimulation.value;
        const progress = progressByHorseId.value;
        let leader: HorseId | null = null;
        let best = 0;
        for (const { horseId } of simulation ? rankPlacements(simulation) : []) {
            const value = progress.get(horseId) as number;
            if (value > best) {
                best = value;
                leader = horseId;
            }
        }
        return leader;
    });

    return { activeRound, phase, progressByHorseId, leaderId };
}
