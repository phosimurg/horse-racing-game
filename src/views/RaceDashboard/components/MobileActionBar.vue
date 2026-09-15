<template>
    <div class="mobile-action-bar">
        <slot />
    </div>
</template>

<style scoped>
.mobile-action-bar {
    position: sticky;
    inset-block-end: 0;
    z-index: var(--z-sticky);
    display: flex;
    justify-content: center;
    padding-block: var(--space-3);
    padding-inline: var(--space-4);
    background: var(--color-surface);
    border-block-start: 1px solid var(--color-border);
}
</style>
