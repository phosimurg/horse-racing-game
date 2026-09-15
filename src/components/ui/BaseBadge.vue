<script setup lang="ts">
const { tone = 'neutral' } = defineProps<{
    tone?: 'neutral' | 'live' | 'gold' | 'silver' | 'bronze';
}>();
</script>

<template>
    <span
        class="base-badge"
        :class="`tone-${tone}`"
    >
        <slot />
    </span>
</template>

<style scoped>
.base-badge {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    padding-block: 0.125rem;
    padding-inline: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
}

.tone-live {
    color: var(--color-accent-ink);
    background: var(--color-accent);
    border-color: var(--color-accent-border);
}

.tone-gold,
.tone-silver,
.tone-bronze {
    color: var(--color-podium-ink);
    border-color: transparent;
}

.tone-gold {
    background: var(--color-gold);
}

.tone-silver {
    background: var(--color-silver);
}

.tone-bronze {
    background: var(--color-bronze);
}
</style>
