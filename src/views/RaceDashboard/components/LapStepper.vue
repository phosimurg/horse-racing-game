<script setup lang="ts">
import type { LapStep } from '../dashboard.types';

const { laps } = defineProps<{ laps: readonly LapStep[] }>();
</script>

<template>
    <ol
        v-if="laps.length > 0"
        class="lap-stepper"
        role="list"
        aria-label="Laps"
        tabindex="0"
    >
        <li
            v-for="lap in laps"
            :key="lap.number"
            class="lap-step"
            :class="`state-${lap.state}`"
            :aria-current="lap.state === 'live' ? 'step' : undefined"
        >
            <span class="lap-step-name">Lap {{ lap.number }}</span>
            <span class="lap-step-distance">{{ lap.distance }} m</span>
        </li>
    </ol>
</template>

<style scoped>
.lap-stepper {
    display: flex;
    gap: var(--space-1);
    min-inline-size: 0;
    overflow-x: auto;
}

.lap-step {
    display: grid;
    flex: 1 0 4.5rem;
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    font-size: var(--font-size-sm);
    font-stretch: var(--font-stretch-condensed);
    line-height: var(--line-height-tight);
    color: var(--color-text-muted);
    text-transform: uppercase;
    border-block-end: 3px solid var(--color-border);
}

.lap-step-name {
    font-weight: var(--font-weight-black);
}

.state-finished {
    color: var(--color-text);
    border-block-end-color: var(--color-text-muted);
}

.state-live {
    color: var(--color-text);
    border-block-end-color: var(--color-accent-border);
}
</style>
