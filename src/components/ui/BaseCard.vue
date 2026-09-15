<script setup lang="ts">
import { useId } from 'vue';

const { title, headingLevel = 2 } = defineProps<{ title: string; headingLevel?: 2 | 3 }>();

const headingId = useId();
</script>

<template>
    <section
        class="base-card"
        :aria-labelledby="headingId"
    >
        <header class="base-card-header">
            <component
                :is="`h${headingLevel}`"
                :id="headingId"
                class="base-card-title"
            >
                {{ title }}
            </component>
            <slot name="actions" />
        </header>
        <slot />
    </section>
</template>

<style scoped>
.base-card {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    min-inline-size: 0;
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-raised);
}

.base-card-header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    justify-content: space-between;
}

.base-card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-black);
    font-stretch: var(--font-stretch-condensed);
    line-height: var(--line-height-tight);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
</style>
