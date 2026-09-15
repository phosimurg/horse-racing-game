<script setup lang="ts">
import ConditionMeter from '@/components/common/ConditionMeter.vue';
import SilkChip from '@/components/common/SilkChip.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseTable from '@/components/ui/BaseTable.vue';
import type { Horse } from '@/domain';

const { horses } = defineProps<{ horses: readonly Horse[] }>();

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'condition', label: 'Condition' },
    { key: 'color', label: 'Color' },
];
</script>

<template>
    <BaseCard
        class="horse-roster"
        title="Horse List"
    >
        <template #actions>
            <span class="horse-roster-count">{{ horses.length }} horses</span>
        </template>
        <div
            class="horse-roster-scroll"
            role="region"
            aria-label="Horse list table"
            tabindex="0"
        >
            <BaseTable
                caption="Horses with their condition and silk color"
                caption-hidden
                :columns="COLUMNS"
                :rows="horses"
                :row-key="(horse) => String(horse.id)"
            >
                <template #cell-condition="{ row }">
                    <ConditionMeter
                        :condition="row.condition"
                        :label="`Condition of ${row.name}`"
                    />
                </template>
                <template #cell-color="{ row }">
                    <SilkChip
                        :color="row.color"
                        :bib="row.id"
                    />
                </template>
            </BaseTable>
        </div>
    </BaseCard>
</template>

<style scoped>
.horse-roster-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
}

.horse-roster-scroll {
    /* Keeps the visually hidden table captions inside the scroll area. */
    position: relative;
    overflow-x: auto;
}
</style>
