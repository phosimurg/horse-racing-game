<script setup lang="ts">
import { computed } from 'vue';

import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseTable from '@/components/ui/BaseTable.vue';
import type { Horse, HorseId, Round } from '@/domain';
import { formatLapTitle } from '@/utils/formatLapTitle';

const { round, horsesById, state } = defineProps<{
    round: Round;
    horsesById: ReadonlyMap<HorseId, Horse>;
    state: 'upcoming' | 'live' | 'finished';
}>();

const STATE_LABELS = { upcoming: 'Upcoming', live: 'Live', finished: 'Finished' } as const;
const COLUMNS = [
    { key: 'lane', label: 'Position', numeric: true },
    { key: 'name', label: 'Name' },
];

const title = computed(() => formatLapTitle(round.number, round.distance));
const rows = computed(() =>
    round.horseIds.map((horseId, index) => ({
        lane: index + 1,
        name: horsesById.get(horseId)?.name ?? `Horse ${horseId}`,
    }))
);
</script>

<template>
    <BaseCard
        class="round-card"
        :class="`state-${state}`"
        :title="title"
        :heading-level="3"
        :aria-current="state === 'live' ? 'step' : undefined"
    >
        <template #actions>
            <BaseBadge :tone="state === 'live' ? 'live' : 'neutral'">
                {{ STATE_LABELS[state] }}
            </BaseBadge>
        </template>
        <BaseTable
            :caption="`${title} lane order`"
            caption-hidden
            :columns="COLUMNS"
            :rows="rows"
            :row-key="(row) => String(row.lane)"
        />
    </BaseCard>
</template>

<style scoped>
.state-live {
    border-color: var(--color-accent-border);
}
</style>
