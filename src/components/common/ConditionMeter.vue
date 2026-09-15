<script setup lang="ts">
import { CONDITION_MAX, CONDITION_MIN } from '@/domain';

const { condition, label } = defineProps<{ condition: number; label: string }>();
</script>

<template>
    <span class="condition-meter">
        <meter
            class="condition-meter-bar"
            :min="CONDITION_MIN"
            :max="CONDITION_MAX"
            :value="condition"
            :aria-label="label"
        />
        <span
            class="condition-meter-value"
            aria-hidden="true"
        >
            {{ condition }}
        </span>
    </span>
</template>

<style scoped>
.condition-meter {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
}

.condition-meter-bar {
    inline-size: 4rem;
    block-size: 0.5rem;
    accent-color: var(--color-accent);
}

.condition-meter-value {
    min-inline-size: 2ch;
    font-variant-numeric: tabular-nums;
    text-align: end;
}
</style>
