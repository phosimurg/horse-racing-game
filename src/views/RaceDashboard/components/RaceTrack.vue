<script setup lang="ts">
import { computed, useId } from 'vue';

import type { Horse, HorseId, Round } from '@/domain';
import { formatLapBanner } from '@/utils/formatLapTitle';

import RaceLane from './RaceLane.vue';

const { round, roundCount, horsesById, progressByHorseId, leaderId, moving } = defineProps<{
    round: Round | null;
    roundCount: number;
    horsesById: ReadonlyMap<HorseId, Horse>;
    progressByHorseId: ReadonlyMap<HorseId, number>;
    leaderId: HorseId | null;
    moving: boolean;
}>();

const headingId = useId();

const lanes = computed(() =>
    (round?.horseIds ?? []).flatMap((horseId, index) => {
        const horse = horsesById.get(horseId);
        return horse
            ? [{ lane: index + 1, horse, progress: progressByHorseId.get(horseId) ?? 0 }]
            : [];
    })
);
const banner = computed(() =>
    round ? formatLapBanner(round.number, roundCount, round.distance) : ''
);
const leaderText = computed(() => {
    const leader = leaderId === null ? undefined : horsesById.get(leaderId);
    return leader ? `Leader: ${leader.name}` : 'At the start gate';
});
</script>

<template>
    <section
        id="race-track"
        class="race-track"
        :aria-labelledby="headingId"
        tabindex="-1"
    >
        <h2
            :id="headingId"
            class="visually-hidden"
        >
            Race track
        </h2>
        <p
            v-if="!round"
            class="race-track-guidance"
        >
            Generate a program to line up the horses at the start gate.
        </p>
        <template v-else>
            <ol
                class="race-track-lanes"
                role="list"
                aria-label="Lanes"
            >
                <RaceLane
                    v-for="entry in lanes"
                    :key="entry.horse.id"
                    :lane="entry.lane"
                    :horse="entry.horse"
                    :progress="entry.progress"
                    :moving="moving"
                />
            </ol>
            <p class="race-track-banner">
                <span class="race-track-lap">{{ banner }}</span>
                <span class="race-track-leader">{{ leaderText }}</span>
            </p>
        </template>
    </section>
</template>

<style scoped>
.race-track {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    min-inline-size: 0;
    padding: var(--space-3);
    color: var(--color-lane-ink);
    background: repeating-linear-gradient(
        90deg,
        var(--color-turf) 0 3rem,
        var(--color-turf-stripe) 3rem 6rem
    );
    border-block: 4px solid var(--color-rail);
    border-radius: var(--radius-md);
}

.race-track:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
}

.race-track-guidance {
    padding-block: var(--space-12);
    padding-inline: var(--space-4);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    text-align: center;
}

.race-track-banner {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    justify-content: space-between;
    padding-block: var(--space-2);
    padding-inline: var(--space-4);
    font-weight: var(--font-weight-black);
    font-stretch: var(--font-stretch-condensed);
    color: var(--color-text);
    text-transform: uppercase;
    background: var(--color-surface);
    border-inline-start: 6px solid var(--color-accent-border);
    border-radius: var(--radius-sm);
}
</style>
