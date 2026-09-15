<script setup lang="ts" generic="Row extends object">
const {
    caption,
    columns,
    rows,
    rowKey,
    captionHidden = false,
} = defineProps<{
    caption: string;
    columns: readonly { key: string; label: string; numeric?: boolean }[];
    rows: readonly Row[];
    rowKey: (row: Row) => string;
    captionHidden?: boolean;
}>();

function cellValue(row: Row, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}
</script>

<template>
    <table class="base-table">
        <caption :class="captionHidden ? 'visually-hidden' : 'base-table-caption'">
            {{
                caption
            }}
        </caption>
        <thead>
            <tr>
                <th
                    v-for="column in columns"
                    :key="column.key"
                    scope="col"
                    :class="{ numeric: column.numeric }"
                >
                    {{ column.label }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr
                v-for="row in rows"
                :key="rowKey(row)"
            >
                <td
                    v-for="column in columns"
                    :key="column.key"
                    :class="{ numeric: column.numeric }"
                >
                    <slot
                        :name="`cell-${column.key}`"
                        :row="row"
                    >
                        {{ cellValue(row, column.key) }}
                    </slot>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
.base-table {
    inline-size: 100%;
    font-size: var(--font-size-sm);
    border-collapse: collapse;
}

.base-table-caption {
    padding-block-end: var(--space-2);
    font-weight: var(--font-weight-bold);
    text-align: start;
}

th,
td {
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    text-align: start;
    border-block-end: 1px solid var(--color-border);
}

th {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.numeric {
    font-variant-numeric: tabular-nums;
    text-align: end;
}
</style>
