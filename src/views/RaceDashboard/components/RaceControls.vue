<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/ui/BaseButton.vue';
import BaseIcon from '@/components/ui/BaseIcon.vue';
import type { RaceStatus } from '@/domain';

const { status, canGenerate, canStart } = defineProps<{
    status: RaceStatus;
    canGenerate: boolean;
    canStart: boolean;
}>();

const emit = defineEmits<{ generate: []; toggle: [] }>();

const control = computed(() => {
    if (status === 'running') {
        return { label: 'Pause', icon: 'pause' } as const;
    }
    return { label: status === 'paused' ? 'Resume' : 'Start', icon: 'start' } as const;
});
</script>

<template>
    <div class="race-controls">
        <BaseButton
            size="lg"
            :disabled="!canGenerate"
            @activate="emit('generate')"
        >
            <template #icon>
                <BaseIcon name="refresh" />
            </template>
            Generate Program
        </BaseButton>
        <BaseButton
            variant="primary"
            size="lg"
            :disabled="!canStart"
            @activate="emit('toggle')"
        >
            <template #icon>
                <BaseIcon :name="control.icon" />
            </template>
            {{ control.label }}
        </BaseButton>
    </div>
</template>

<style scoped>
.race-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}
</style>
