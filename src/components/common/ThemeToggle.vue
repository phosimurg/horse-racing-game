<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseIcon from '@/components/ui/BaseIcon.vue';

const { theme } = defineProps<{ theme: 'light' | 'dark' }>();

const emit = defineEmits<{ toggle: [] }>();
</script>

<template>
    <BaseButton
        variant="ghost"
        :aria-pressed="theme === 'dark' ? 'true' : 'false'"
        @activate="emit('toggle')"
    >
        <template #icon>
            <BaseIcon :name="theme === 'dark' ? 'moon' : 'sun'" />
        </template>
        Dark theme
    </BaseButton>
</template>
