<script setup lang="ts">
import type { IconName } from './icons';

const { name } = defineProps<{ name: IconName }>();
</script>

<template>
    <svg
        class="base-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
    >
        <path
            v-if="name === 'start'"
            d="M8 5.5v13l10.5-6.5z"
            fill="currentColor"
        />
        <g
            v-else-if="name === 'pause'"
            fill="currentColor"
        >
            <rect
                x="6.5"
                y="5"
                width="4"
                height="14"
                rx="1"
            />
            <rect
                x="13.5"
                y="5"
                width="4"
                height="14"
                rx="1"
            />
        </g>
        <g
            v-else
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path
                v-if="name === 'refresh'"
                d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4h-4"
            />
            <template v-else-if="name === 'sun'">
                <circle
                    cx="12"
                    cy="12"
                    r="4"
                />
                <path
                    d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
                />
            </template>
            <path
                v-else-if="name === 'moon'"
                d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"
            />
            <path
                v-else
                d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.5A3.5 3.5 0 0 0 8.5 11M16 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4M8.5 20h7"
            />
        </g>
    </svg>
</template>

<style scoped>
.base-icon {
    flex: none;
    inline-size: 1.25rem;
    block-size: 1.25rem;
}
</style>
