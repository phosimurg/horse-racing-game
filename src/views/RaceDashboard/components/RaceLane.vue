<script setup lang="ts">
import { computed } from 'vue';

import HorseRunner from '@/components/common/HorseRunner.vue';
import type { Horse } from '@/domain';

const { lane, horse, progress, moving } = defineProps<{
    lane: number;
    horse: Horse;
    progress: number;
    moving: boolean;
}>();

const runnerStyle = computed(() => ({ '--progress': progress }));
</script>

<template>
    <li class="race-lane">
        <span
            class="race-lane-number"
            aria-hidden="true"
        >
            {{ lane }}
        </span>
        <span class="race-lane-name">{{ horse.name }}</span>
        <span class="race-lane-strip">
            <HorseRunner
                class="race-lane-runner"
                :style="runnerStyle"
                :color="horse.color"
                :bib="horse.id"
                :moving="moving"
            />
        </span>
    </li>
</template>

<style scoped>
.race-lane {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, min(8rem, 30%)) minmax(0, 1fr);
    gap: var(--space-2);
    align-items: center;
    min-block-size: 2.75rem;
    border-block-end: 1px dashed var(--color-rail);
}

.race-lane-number {
    font-weight: var(--font-weight-black);
    font-variant-numeric: tabular-nums;
    text-align: center;
}

.race-lane-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
}

.race-lane-strip {
    position: relative;
    block-size: 2.5rem;
    container-type: inline-size;
}

.race-lane-strip::after {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    inline-size: 0.5rem;
    content: '';
    background: repeating-conic-gradient(var(--color-rail) 0 25%, var(--color-accent-ink) 0 50%) 0
        0 / 0.5rem 0.5rem;
}

.race-lane-runner {
    position: absolute;
    inset-block-end: 0.125rem;
    inset-inline-start: 0;
    transform: translateX(calc(var(--progress) * (100cqi - 3.5rem)));
}
</style>
