<script setup lang="ts">
const { target } = defineProps<{ target: string }>();
</script>

<template>
    <a
        class="skip-link"
        :href="`#${target}`"
    >
        <slot />
    </a>
</template>

<style scoped>
.skip-link {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-start: var(--space-2);
    z-index: var(--z-sticky);
    padding: var(--space-2) var(--space-4);
    font-weight: var(--font-weight-bold);
    color: var(--color-accent-ink);
    background: var(--color-accent);
    border-radius: var(--radius-sm);
    transform: translateY(-200%);
}

.skip-link:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
    transform: none;
}
</style>
