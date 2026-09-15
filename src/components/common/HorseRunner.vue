<script setup lang="ts">
import { computed } from 'vue';

import type { HorseColor } from '@/domain';
import { readableTextColor } from '@/utils/readableTextColor';

const {
    color,
    bib,
    moving = false,
} = defineProps<{
    color: HorseColor;
    bib: number;
    moving?: boolean;
}>();

const bibInk = computed(() => readableTextColor(color.hex));
</script>

<template>
    <svg
        class="horse-runner"
        :class="{ moving }"
        viewBox="0 0 64 40"
        aria-hidden="true"
        focusable="false"
    >
        <g class="horse-runner-horse">
            <ellipse
                cx="30"
                cy="23"
                rx="15"
                ry="7"
            />
            <path d="M40 20 49 9l8 2-2 5-6 1-4 7z" />
            <path
                d="M17 27l-3 10M23 29l2 8M37 28l-3 9M42 26l5 9M16 21q-9 1-11 10"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
            />
        </g>
        <path
            :fill="color.hex"
            d="M27 7h9l2 9-10 1z"
        />
        <circle
            cx="33"
            cy="4.5"
            r="3"
            :fill="color.hex"
        />
        <rect
            x="22"
            y="18.5"
            width="13"
            height="9"
            rx="2"
            :fill="color.hex"
        />
        <text
            x="28.5"
            y="25.5"
            text-anchor="middle"
            font-size="7"
            font-weight="800"
            :fill="bibInk"
        >
            {{ bib }}
        </text>
    </svg>
</template>

<style scoped>
.horse-runner {
    inline-size: 3.5rem;
    block-size: auto;
    overflow: visible;
    color: var(--color-rail);
}

.horse-runner-horse {
    fill: currentcolor;
}

@media (prefers-reduced-motion: no-preference) {
    .moving {
        animation: gallop 0.3s ease-in-out infinite alternate;
    }
}

/* The translate property adds to the lane's positioning transform instead of replacing it. */
@keyframes gallop {
    to {
        translate: 0 -2px;
    }
}
</style>
