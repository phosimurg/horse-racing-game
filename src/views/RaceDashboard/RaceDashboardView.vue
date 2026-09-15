<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import ThemeToggle from '@/components/common/ThemeToggle.vue';
import BaseTabs from '@/components/ui/BaseTabs.vue';
import LiveAnnouncer from '@/components/ui/LiveAnnouncer.vue';
import SkipLink from '@/components/ui/SkipLink.vue';
import { useAnnouncer } from '@/composables/useAnnouncer';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { useRacePlayback } from '@/composables/useRacePlayback';
import { useTheme } from '@/composables/useTheme';
import { useHorsesStore } from '@/stores/horses';
import { useRaceStore } from '@/stores/race';

import AppBar from './components/AppBar.vue';
import HorseRoster from './components/HorseRoster.vue';
import MobileActionBar from './components/MobileActionBar.vue';
import ProgramPanel from './components/ProgramPanel.vue';
import RaceControls from './components/RaceControls.vue';
import RaceTrack from './components/RaceTrack.vue';
import ResultsPanel from './components/ResultsPanel.vue';
import type { LapState, LapStep } from './dashboard.types';

const horsesStore = useHorsesStore();
const race = useRaceStore();
const playback = useRacePlayback();
const { theme, toggleTheme } = useTheme();
const isNarrow = useMediaQuery('(width < 768px)');
const { message, announce } = useAnnouncer();

const TABS = [
    { id: 'horses', label: 'Horses' },
    { id: 'program', label: 'Program' },
    { id: 'results', label: 'Results' },
];
const activeTab = ref('horses');

const rounds = computed(() => race.program?.rounds ?? []);
const isRacing = computed(() => race.status === 'running' && playback.phase.value === 'racing');
const lapStates = computed<LapState[]>(() => {
    const activeNumber = playback.activeRound.value?.number;
    const isLive = race.status === 'running' || race.status === 'paused';
    return rounds.value.map((round, index) => {
        if (index < race.results.length) {
            return 'finished';
        }
        return isLive && round.number === activeNumber ? 'live' : 'upcoming';
    });
});
const laps = computed<LapStep[]>(() =>
    rounds.value.map((round, index) => ({
        number: round.number,
        distance: round.distance,
        state: lapStates.value[index] ?? 'upcoming',
    }))
);

function lapPhrase(roundNumber: number, distance: number): string {
    return `Lap ${roundNumber}, ${distance} meters.`;
}

// Design 7.2 announcements; results are watched before status so the last winner comes first.
watch(
    () => race.program,
    (program) => {
        const first = program?.rounds[0];
        const last = program?.rounds[program.rounds.length - 1];
        if (first && last) {
            announce(
                `New program ready: ${horsesStore.horses.length} new horses, ${program.rounds.length} laps from ${first.distance} to ${last.distance} meters.`
            );
        }
    }
);
watch(
    () => race.results.length,
    (length, previousLength) => {
        const result = race.results[length - 1];
        const winner = horsesStore.horsesById.get(result?.placements[0]?.horseId ?? -1);
        if (length > previousLength && result && winner) {
            announce(`Lap ${result.roundNumber} finished. Winner: ${winner.name}.`);
        }
    }
);
watch(
    () => race.status,
    (status, previousStatus) => {
        const first = rounds.value[0];
        if (status === 'running' && previousStatus === 'ready' && first) {
            announce(`Race started. ${lapPhrase(first.number, first.distance)}`);
        } else if (status === 'running' && previousStatus === 'paused') {
            announce('Race resumed.');
        } else if (status === 'paused') {
            announce('Race paused.');
        } else if (status === 'finished') {
            announce(`Race finished. All ${rounds.value.length} laps complete.`);
        }
    }
);
watch(
    () => playback.activeRound.value,
    (round, previousRound) => {
        if (round && previousRound && round.number > previousRound.number) {
            announce(lapPhrase(round.number, round.distance));
        }
    }
);
</script>

<template>
    <SkipLink target="race-track">Skip to the race track</SkipLink>
    <AppBar :laps="laps">
        <RaceControls
            v-if="!isNarrow"
            :status="race.status"
            :can-generate="race.canGenerate"
            :can-start="race.canStart"
            @generate="race.generateProgram()"
            @toggle="race.toggle()"
        />
        <ThemeToggle
            :theme="theme"
            @toggle="toggleTheme"
        />
    </AppBar>
    <main
        class="dashboard"
        :class="{ narrow: isNarrow }"
    >
        <RaceTrack
            class="dashboard-track"
            :round="playback.activeRound.value"
            :round-count="rounds.length"
            :horses-by-id="horsesStore.horsesById"
            :progress-by-horse-id="playback.progressByHorseId.value"
            :leader-id="playback.leaderId.value"
            :moving="isRacing"
        />
        <BaseTabs
            v-if="isNarrow"
            v-model="activeTab"
            class="dashboard-tabs"
            label="Race panels"
            :tabs="TABS"
        >
            <template #horses>
                <HorseRoster :horses="horsesStore.horses" />
            </template>
            <template #program>
                <ProgramPanel
                    :rounds="rounds"
                    :horses-by-id="horsesStore.horsesById"
                    :states="lapStates"
                />
            </template>
            <template #results>
                <ResultsPanel
                    :results="race.results"
                    :horses-by-id="horsesStore.horsesById"
                    :has-program="race.program !== null"
                />
            </template>
        </BaseTabs>
        <template v-else>
            <HorseRoster
                class="dashboard-roster"
                :horses="horsesStore.horses"
            />
            <div class="dashboard-side">
                <ProgramPanel
                    :rounds="rounds"
                    :horses-by-id="horsesStore.horsesById"
                    :states="lapStates"
                />
                <ResultsPanel
                    :results="race.results"
                    :horses-by-id="horsesStore.horsesById"
                    :has-program="race.program !== null"
                />
            </div>
        </template>
    </main>
    <MobileActionBar v-if="isNarrow">
        <RaceControls
            :status="race.status"
            :can-generate="race.canGenerate"
            :can-start="race.canStart"
            @generate="race.generateProgram()"
            @toggle="race.toggle()"
        />
    </MobileActionBar>
    <LiveAnnouncer :message="message" />
</template>

<style scoped>
.dashboard {
    display: grid;
    gap: var(--space-4);
    max-inline-size: 110rem;
    padding: var(--space-4);
    margin-inline: auto;
}

.dashboard-side {
    display: grid;
    gap: var(--space-4);
    align-content: start;
    min-inline-size: 0;
}

@media (width >= 768px) and (width < 1280px) {
    .dashboard {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    .dashboard-track {
        grid-column: 1 / -1;
    }
}

@media (width >= 1280px) {
    .dashboard {
        grid-template-columns: minmax(18rem, 22rem) minmax(0, 1fr) minmax(20rem, 26rem);
        align-items: start;
    }

    .dashboard-roster {
        grid-row: 1;
        grid-column: 1;
    }

    .dashboard-track {
        grid-row: 1;
        grid-column: 2;
    }

    .dashboard-side {
        grid-row: 1;
        grid-column: 3;
    }
}
</style>
