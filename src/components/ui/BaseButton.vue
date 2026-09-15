<script setup lang="ts">
const {
    variant = 'secondary',
    size = 'md',
    disabled = false,
} = defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'md' | 'lg';
    disabled?: boolean;
}>();

const emit = defineEmits<{ activate: [] }>();

// Design 7.4: a double click or a held key counts as a single activation (CTRL-02).
function onClick(event: MouseEvent): void {
    if (event.detail <= 1) {
        emit('activate');
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
    }
}
</script>

<template>
    <button
        type="button"
        class="base-button"
        :class="[`variant-${variant}`, `size-${size}`]"
        :disabled="disabled"
        @click="onClick"
        @keydown="onKeydown"
    >
        <slot name="icon" />
        <span class="base-button-label"><slot /></span>
    </button>
</template>

<style scoped>
.base-button {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
    min-block-size: var(--target-min);
    padding-block: var(--space-1);
    padding-inline: var(--space-3);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text);
    cursor: pointer;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
}

.base-button :deep(svg) {
    inline-size: 1.25em;
    block-size: 1.25em;
}

.size-lg {
    min-inline-size: var(--target-primary);
    min-block-size: var(--target-primary);
    padding-inline: var(--space-6);
    font-size: var(--font-size-md);
    font-stretch: var(--font-stretch-condensed);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.variant-primary {
    color: var(--color-accent-ink);
    background: var(--color-accent);
    border-color: var(--color-accent-border);
}

.variant-ghost {
    background: transparent;
    border-color: transparent;
}

.base-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.base-button:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
}

@media (hover: hover) {
    .base-button:not(:disabled):hover {
        border-color: var(--color-text-muted);
    }

    .variant-primary:not(:disabled):hover {
        border-color: var(--color-text);
    }
}

@media (forced-colors: active) {
    .base-button {
        border-color: ButtonText;
    }
}
</style>
