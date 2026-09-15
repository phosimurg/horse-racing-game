<script setup lang="ts">
import { computed } from 'vue';

import type { HorseColor } from '@/domain';
import { readableTextColor } from '@/utils/readableTextColor';

const { color, bib } = defineProps<{ color: HorseColor; bib: number }>();

const swatchStyle = computed(() => ({
    '--silk': color.hex,
    '--silk-ink': readableTextColor(color.hex),
}));
</script>

<template>
    <span class="silk-chip">
        <span
            class="silk-chip-swatch"
            :style="swatchStyle"
            aria-hidden="true"
        >
            {{ bib }}
        </span>
        <span class="silk-chip-name">{{ color.name }}</span>
    </span>
</template>

<style scoped>
.silk-chip {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
}

.silk-chip-swatch {
    display: inline-grid;
    place-items: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    font-size: 0.75rem;
    font-weight: var(--font-weight-black);
    font-variant-numeric: tabular-nums;
    color: var(--silk-ink);
    background: var(--silk);
    border: 1px solid var(--color-border);
    border-radius: 50%;
}
</style>
