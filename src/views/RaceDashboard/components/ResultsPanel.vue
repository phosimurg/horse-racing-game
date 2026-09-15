<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue';

import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseIcon from '@/components/ui/BaseIcon.vue';
import BaseTable from '@/components/ui/BaseTable.vue';
import type { Horse, HorseId, RoundResult } from '@/domain';
import { formatLapTitle } from '@/utils/formatLapTitle';

const { results, horsesById, hasProgram } = defineProps<{
    results: readonly RoundResult[];
    horsesById: ReadonlyMap<HorseId, Horse>;
    hasProgram: boolean;
}>();

const COLUMNS = [
    { key: 'position', label: 'Position', numeric: true },
    { key: 'name', label: 'Name' },
    { key: 'podium', label: 'Podium' },
];
const PODIUM = [
    { tone: 'gold', label: '1st' },
    { tone: 'silver', label: '2nd' },
    { tone: 'bronze', label: '3rd' },
] as const;

const list = useTemplateRef<HTMLOListElement>('list');

function rowsOf(result: RoundResult) {
    return result.placements.map((placement) => ({
        position: placement.position,
        name: horsesById.get(placement.horseId)?.name ?? `Horse ${placement.horseId}`,
        podium: PODIUM[placement.position - 1] ?? null,
    }));
}

// RES-01: bring the newest lap into view inside the panel.
watch(
    () => results.length,
    async (length, previousLength) => {
        if (length > previousLength) {
            await nextTick();
            list.value?.lastElementChild?.scrollIntoView({ block: 'nearest' });
        }
    }
);
</script>

<template>
    <BaseCard
        class="results-panel"
        title="Results"
    >
        <p
            v-if="results.length === 0"
            class="panel-guidance"
        >
            {{
                hasProgram
                    ? 'Results appear here as each lap finishes.'
                    : 'Generate a program, then start the race to see results lap by lap.'
            }}
        </p>
        <ol
            v-else
            ref="list"
            class="results-list"
            role="list"
            aria-label="Results by lap"
            tabindex="0"
        >
            <li
                v-for="result in results"
                :key="result.roundNumber"
            >
                <BaseTable
                    :caption="formatLapTitle(result.roundNumber, result.distance)"
                    :columns="COLUMNS"
                    :rows="rowsOf(result)"
                    :row-key="(row) => String(row.position)"
                >
                    <template #cell-podium="{ row }">
                        <BaseBadge
                            v-if="row.podium"
                            :tone="row.podium.tone"
                        >
                            <BaseIcon name="trophy" />
                            {{ row.podium.label }}
                        </BaseBadge>
                    </template>
                </BaseTable>
            </li>
        </ol>
    </BaseCard>
</template>

<style scoped>
.panel-guidance {
    color: var(--color-text-muted);
}

.results-list {
    display: grid;
    gap: var(--space-4);
    max-block-size: 36rem;
    overflow-y: auto;
}

@media (prefers-reduced-motion: no-preference) {
    .results-list {
        scroll-behavior: smooth;
    }
}
</style>
