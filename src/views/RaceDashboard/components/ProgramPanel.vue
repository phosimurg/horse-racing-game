<script setup lang="ts">
import RoundCard from '@/components/common/RoundCard.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import type { Horse, HorseId, Round } from '@/domain';

import type { LapState } from '../dashboard.types';

const { rounds, horsesById, states } = defineProps<{
    rounds: readonly Round[];
    horsesById: ReadonlyMap<HorseId, Horse>;
    states: readonly LapState[];
}>();
</script>

<template>
    <BaseCard
        class="program-panel"
        title="Program"
    >
        <p
            v-if="rounds.length === 0"
            class="panel-guidance"
        >
            Generate a program to see the six laps and their lane order.
        </p>
        <ol
            v-else
            class="program-list"
            role="list"
            aria-label="Program laps"
            tabindex="0"
        >
            <li
                v-for="(round, index) in rounds"
                :key="round.number"
            >
                <RoundCard
                    :round="round"
                    :horses-by-id="horsesById"
                    :state="states[index] ?? 'upcoming'"
                />
            </li>
        </ol>
    </BaseCard>
</template>

<style scoped>
.panel-guidance {
    color: var(--color-text-muted);
}

.program-list {
    display: grid;
    gap: var(--space-3);
    max-block-size: 36rem;
    overflow-y: auto;
}
</style>
