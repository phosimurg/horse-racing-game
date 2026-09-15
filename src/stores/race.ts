import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { useRng } from '@/composables/useRng';
import {
    generateProgram as buildProgram,
    rankPlacements,
    type RaceProgram,
    type RaceStatus,
    type RoundResult,
} from '@/domain';

import { useHorsesStore } from './horses';

export const useRaceStore = defineStore('race', () => {
    const rng = useRng();
    const horsesStore = useHorsesStore();
    const status = ref<RaceStatus>('idle');
    const program = shallowRef<RaceProgram | null>(null);
    const results = shallowRef<readonly RoundResult[]>([]);

    const canGenerate = computed(() => status.value !== 'running' && status.value !== 'paused');
    const canStart = computed(() => status.value !== 'idle' && status.value !== 'finished');

    function generateProgram(): void {
        if (!canGenerate.value) {
            return;
        }
        horsesStore.generate();
        program.value = buildProgram(horsesStore.horses, rng);
        results.value = [];
        status.value = 'ready';
    }

    function start(): void {
        if (status.value === 'ready' || status.value === 'paused') {
            status.value = 'running';
        }
    }

    function pause(): void {
        if (status.value === 'running') {
            status.value = 'paused';
        }
    }

    function toggle(): void {
        if (status.value === 'running') {
            pause();
        } else {
            start();
        }
    }

    function completeRound(roundIndex: number): void {
        const simulation = program.value?.simulations[roundIndex];
        if (status.value !== 'running' || roundIndex !== results.value.length || !simulation) {
            return;
        }
        const { round } = simulation;
        results.value = [
            ...results.value,
            {
                roundNumber: round.number,
                distance: round.distance,
                placements: rankPlacements(simulation),
            },
        ];
        if (results.value.length === program.value?.simulations.length) {
            status.value = 'finished';
        }
    }

    return {
        status,
        program,
        results,
        canGenerate,
        canStart,
        generateProgram,
        start,
        pause,
        toggle,
        completeRound,
    };
});
