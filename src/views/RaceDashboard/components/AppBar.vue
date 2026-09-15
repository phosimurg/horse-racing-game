<script setup lang="ts">
import type { LapStep } from '../dashboard.types';
import LapStepper from './LapStepper.vue';

const { laps } = defineProps<{ laps: readonly LapStep[] }>();
</script>

<template>
    <header class="app-bar">
        <div class="app-bar-brand">
            <span
                class="app-bar-mark"
                aria-hidden="true"
            />
            <h1 class="app-bar-title">Horse Racing</h1>
        </div>
        <LapStepper
            class="app-bar-laps"
            :laps="laps"
        />
        <div class="app-bar-actions">
            <slot />
        </div>
    </header>
</template>

<style scoped>
.app-bar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-3) var(--space-6);
    align-items: center;
    padding-block: var(--space-3);
    padding-inline: var(--space-4);
    background: var(--color-surface);
    border-block-end: 1px solid var(--color-border);
}

.app-bar-brand {
    display: flex;
    gap: var(--space-2);
    align-items: center;
}

.app-bar-mark {
    inline-size: 0.75rem;
    block-size: 0.75rem;
    background: var(--color-accent);
    border: 1px solid var(--color-accent-border);
    border-radius: 50%;
}

.app-bar-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-black);
    font-stretch: var(--font-stretch-condensed);
    line-height: var(--line-height-tight);
    text-transform: uppercase;
    white-space: nowrap;
}

.app-bar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    justify-content: end;
}

@media (width < 768px) {
    .app-bar {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .app-bar-laps {
        grid-row: 2;
        grid-column: 1 / -1;
    }
}
</style>
