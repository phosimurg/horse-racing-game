<script setup lang="ts">
import { useId, useTemplateRef } from 'vue';

const { tabs, label } = defineProps<{
    tabs: readonly { id: string; label: string }[];
    label: string;
}>();
const selected = defineModel<string>({ required: true });

const baseId = useId();
const tabElements = useTemplateRef<HTMLButtonElement[]>('tabElements');

function tabId(id: string): string {
    return `${baseId}-tab-${id}`;
}

function panelId(id: string): string {
    return `${baseId}-panel-${id}`;
}

// WAI-ARIA APG tabs with automatic activation.
function onKeydown(event: KeyboardEvent, index: number): void {
    const last = tabs.length - 1;
    const targets: Record<string, number> = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
    };
    const target = targets[event.key];
    const tab = target === undefined ? undefined : tabs[target];
    if (target === undefined || !tab) {
        return;
    }
    event.preventDefault();
    selected.value = tab.id;
    tabElements.value?.[target]?.focus();
}
</script>

<template>
    <div class="base-tabs">
        <div
            role="tablist"
            class="base-tabs-list"
            :aria-label="label"
        >
            <button
                v-for="(tab, index) in tabs"
                :id="tabId(tab.id)"
                :key="tab.id"
                ref="tabElements"
                type="button"
                role="tab"
                class="base-tabs-tab"
                :aria-selected="tab.id === selected"
                :aria-controls="panelId(tab.id)"
                :tabindex="tab.id === selected ? 0 : -1"
                @click="selected = tab.id"
                @keydown="onKeydown($event, index)"
            >
                {{ tab.label }}
            </button>
        </div>
        <div
            v-for="tab in tabs"
            v-show="tab.id === selected"
            :id="panelId(tab.id)"
            :key="tab.id"
            role="tabpanel"
            class="base-tabs-panel"
            :aria-labelledby="tabId(tab.id)"
            tabindex="0"
        >
            <slot :name="tab.id" />
        </div>
    </div>
</template>

<style scoped>
.base-tabs {
    display: grid;
    gap: var(--space-3);
}

.base-tabs-list {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: var(--space-1);
    padding: var(--space-1);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
}

.base-tabs-tab {
    min-block-size: var(--target-primary);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: var(--radius-pill);
}

/* The underline marks the selected tab without relying on the fill color. */
.base-tabs-tab[aria-selected='true'] {
    color: var(--color-accent-ink);
    text-decoration-line: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.3em;
    background: var(--color-accent);
}

.base-tabs-tab:focus-visible,
.base-tabs-panel:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
}

@media (forced-colors: active) {
    .base-tabs-tab[aria-selected='true'] {
        color: HighlightText;
        forced-color-adjust: none;
        background: Highlight;
    }
}
</style>
