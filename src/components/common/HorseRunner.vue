<script setup lang="ts">
import { computed, useId } from 'vue';

import type { HorseColor } from '@/domain';
import { readableTextColor } from '@/utils/readableTextColor';

const {
    color,
    bib,
    moving = false,
    atGate = false,
} = defineProps<{
    color: HorseColor;
    bib: number;
    moving?: boolean;
    atGate?: boolean;
}>();

const COATS = ['bay', 'chestnut', 'brown', 'grey', 'black'] as const;
const STRIDE_PHASES = 7;

const outlineId = useId();

const bibInk = computed(() => readableTextColor(color.hex));
const coat = computed(() => COATS[Math.abs(bib) % COATS.length] ?? 'bay');
// Offsets each horse's stride so the field does not gallop in lockstep.
const strideStyle = computed(() => ({
    '--stride-phase': ((Math.abs(bib) * 3) % STRIDE_PHASES) / STRIDE_PHASES,
}));
</script>

<template>
    <svg
        class="horse-runner"
        :class="[`coat-${coat}`, { moving, 'in-stride': !atGate }]"
        :style="strideStyle"
        viewBox="0 0 80 46"
        aria-hidden="true"
        focusable="false"
    >
        <defs>
            <filter
                :id="outlineId"
                x="-15%"
                y="-15%"
                width="130%"
                height="130%"
                color-interpolation-filters="sRGB"
            >
                <feMorphology
                    in="SourceAlpha"
                    operator="dilate"
                    radius="0.8"
                    result="grown"
                />
                <feFlood
                    class="runner-outline"
                    result="ink"
                />
                <feComposite
                    in="ink"
                    in2="grown"
                    operator="in"
                    result="outline"
                />
                <feMerge>
                    <feMergeNode in="outline" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <ellipse
            class="runner-shadow"
            cx="40"
            cy="44.4"
            rx="20"
            ry="1.5"
        />
        <g
            class="runner-body"
            :filter="`url(#${outlineId})`"
        >
            <g class="runner-leg leg-far-hind far">
                <path
                    class="coat-fill"
                    d="M29 24C28.4 28.5 28.6 32.5 29.2 35.8L31.2 35.9C32.6 32.5 34.6 28.5 35 24Z"
                />
                <g class="runner-leg-lower">
                    <path
                        class="points-stroke"
                        d="M30.2 35.8L31 41.4L32.4 43.3"
                    />
                    <path
                        class="runner-hoof"
                        d="M31.4 43L33.7 42.9L34.1 44.4L31.5 44.5Z"
                    />
                </g>
            </g>
            <g class="runner-leg leg-far-fore far">
                <path
                    class="coat-fill"
                    d="M45.8 25.5C46 29 46.4 32 46.7 35.2L48.7 35.2C49 32 49.2 29 49 25.5Z"
                />
                <g class="runner-leg-lower">
                    <path
                        class="points-stroke"
                        d="M47.7 35.2L47.8 41.4L49.1 43.3"
                    />
                    <path
                        class="runner-hoof"
                        d="M48.1 43L50.4 42.9L50.8 44.4L48.2 44.5Z"
                    />
                </g>
            </g>
            <g class="runner-tail">
                <path
                    class="points-fill"
                    d="M23.5 19C18.5 18.2 13.5 20.5 9.2 26.8C12 25.4 14.2 25.6 16.2 26.6C14.8 24.4 18.5 22 23.2 21.8Z"
                />
            </g>
            <path
                class="coat-fill"
                d="M26 17.5C31 17.2 34 19 37 18.8C40 18.6 42 16.9 44.5 16.8C50 14.5 54.5 8.5 58.5 6.5L60.5 11.5C57.5 15.5 54.5 20 53.5 25C54 27.5 53.2 29 52 29.5C50.5 31 49 31 47 31C42 31.8 37 31.2 33 30.2C30 30 29 31.8 26.5 31C23.5 30 21 27 21.5 24C22 20 23.5 17.8 26 17.5Z"
            />
            <path
                class="runner-mane"
                d="M45.5 16.2C50.5 13.8 54.5 8.8 58 6.2"
            />
            <g class="runner-head">
                <path
                    class="coat-fill"
                    d="M56.5 6.8C58 4.8 60.8 4.2 62.3 5.2C65.5 6.8 69.5 10.2 71.8 12.8C72.6 13.7 72.2 15.3 70.9 15.5C68.6 15.8 65.6 15.2 63.4 14.2C61 13.2 58.3 11.6 56.5 6.8Z"
                />
                <path
                    class="coat-fill"
                    d="M59.3 5.4L60.2 1.9L61.6 5.1Z"
                />
                <circle
                    class="runner-eye"
                    cx="63.3"
                    cy="8.4"
                    r="0.75"
                />
                <circle
                    class="runner-eye"
                    cx="70.7"
                    cy="13.5"
                    r="0.45"
                />
            </g>
            <path
                class="runner-rein"
                d="M54.8 12.8C59 12.9 63.5 13.2 67.6 13.8"
            />
            <rect
                x="33.6"
                y="18.4"
                width="10.4"
                height="8"
                rx="1.3"
                :fill="color.hex"
            />
            <path
                class="runner-saddle"
                d="M34.6 18.6C37.6 17.4 41.2 17.3 44.2 18.1"
            />
            <text
                class="runner-bib"
                x="38.8"
                y="24.7"
                text-anchor="middle"
                font-size="6.2"
                font-weight="800"
                :fill="bibInk"
            >
                {{ bib }}
            </text>
            <g class="runner-leg leg-near-hind">
                <path
                    class="coat-fill"
                    d="M26 24C25.4 28.5 25.6 32.5 26.2 35.8L28.2 35.9C29.6 32.5 31.6 28.5 32 24Z"
                />
                <g class="runner-leg-lower">
                    <path
                        class="points-stroke"
                        d="M27.2 35.8L28 41.4L29.4 43.3"
                    />
                    <path
                        class="runner-hoof"
                        d="M28.4 43L30.7 42.9L31.1 44.4L28.5 44.5Z"
                    />
                </g>
            </g>
            <g class="runner-leg leg-near-fore">
                <path
                    class="coat-fill"
                    d="M49 25.5C49.2 29 49.6 32 49.9 35.2L51.9 35.2C52.2 32 52.4 29 52.2 25.5Z"
                />
                <g class="runner-leg-lower">
                    <path
                        class="points-stroke"
                        d="M50.9 35.2L51 41.4L52.3 43.3"
                    />
                    <path
                        class="runner-hoof"
                        d="M51.3 43L53.6 42.9L54 44.4L51.4 44.5Z"
                    />
                </g>
            </g>
            <g class="runner-jockey">
                <path
                    class="runner-breeches"
                    d="M39.4 15.9L46.1 14.2"
                />
                <path
                    class="runner-boot"
                    d="M46.1 14.2L43.8 19.4"
                />
                <path
                    d="M38.2 15.4C38.4 11.6 42.6 8.4 47.4 7.4C48.8 7.1 50 7.9 49.6 9.2C49 11 45.2 12.6 41.4 15.8C40.3 16.7 38.1 16.8 38.2 15.4Z"
                    :fill="color.hex"
                />
                <path
                    class="runner-sleeve"
                    d="M47.6 8.6L50.2 11.7L53.9 12.4"
                    :stroke="color.hex"
                />
                <circle
                    class="runner-glove"
                    cx="54.3"
                    cy="12.5"
                    r="0.85"
                />
                <circle
                    cx="50.6"
                    cy="5.4"
                    r="2.3"
                    :fill="color.hex"
                />
                <path
                    d="M52.3 4.7L55 5.3L52.5 6.4Z"
                    :fill="color.hex"
                />
                <circle
                    cx="50.2"
                    cy="3.2"
                    r="0.55"
                    :fill="bibInk"
                />
            </g>
        </g>
    </svg>
</template>

<style scoped>
.horse-runner {
    inline-size: var(--runner-size, 4rem);
    block-size: auto;
    overflow: visible;
}

.coat-bay {
    --coat: var(--color-coat-bay);
    --coat-points: var(--color-coat-bay-points);
}

.coat-chestnut {
    --coat: var(--color-coat-chestnut);
    --coat-points: var(--color-coat-chestnut-points);
}

.coat-brown {
    --coat: var(--color-coat-brown);
    --coat-points: var(--color-coat-brown-points);
}

.coat-grey {
    --coat: var(--color-coat-grey);
    --coat-points: var(--color-coat-grey-points);
}

.coat-black {
    --coat: var(--color-coat-black);
    --coat-points: var(--color-coat-black-points);
}

.runner-outline {
    flood-color: var(--color-rail);
}

.runner-shadow {
    fill: var(--color-track-shadow);
    transform-origin: 40px 44.4px;
}

.coat-fill {
    fill: var(--coat);
}

.points-fill,
.far .coat-fill {
    fill: var(--coat-points);
}

.points-stroke,
.runner-mane,
.runner-rein,
.runner-saddle,
.runner-breeches,
.runner-boot,
.runner-sleeve {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.points-stroke {
    stroke: var(--coat-points);
    stroke-width: 1.9;
}

.runner-mane {
    stroke: var(--coat-points);
    stroke-width: 1.8;
}

.runner-hoof,
.runner-eye {
    fill: var(--color-hoof);
}

.runner-rein {
    stroke: var(--color-hoof);
    stroke-width: 0.45;
}

.runner-saddle {
    stroke: var(--color-boot);
    stroke-width: 1.3;
}

.runner-breeches {
    stroke: var(--color-rail);
    stroke-width: 2.6;
}

.runner-boot {
    stroke: var(--color-boot);
    stroke-width: 2.1;
}

.runner-sleeve {
    stroke-width: 1.8;
}

.runner-glove {
    fill: var(--color-rail);
}

.runner-bib {
    font-stretch: var(--font-stretch-condensed);
}

/* Joint pivots in viewBox units. */
.runner-body,
.runner-head,
.runner-tail,
.runner-jockey,
.runner-shadow,
.runner-leg,
.runner-leg-lower {
    transform-box: view-box;
}

.runner-body {
    transform-origin: 40px 25px;
}

.runner-head {
    transform-origin: 58px 9px;
}

.runner-tail {
    transform-origin: 23px 19.5px;
}

.runner-jockey {
    transform-origin: 40px 16px;
}

.leg-near-fore {
    transform-origin: 50.6px 26px;
}

.leg-far-fore {
    transform-origin: 47.4px 26px;
}

.leg-near-hind {
    transform-origin: 29px 25px;
}

.leg-far-hind {
    transform-origin: 32px 25px;
}

.leg-near-fore .runner-leg-lower {
    transform-origin: 50.9px 35.2px;
}

.leg-far-fore .runner-leg-lower {
    transform-origin: 47.7px 35.2px;
}

.leg-near-hind .runner-leg-lower {
    transform-origin: 27.2px 35.8px;
}

.leg-far-hind .runner-leg-lower {
    transform-origin: 30.2px 35.8px;
}

/* Away from the start gate a still horse holds a stride, like a paused broadcast. */
.in-stride .leg-near-fore {
    transform: rotate(-28deg);
}

.in-stride .leg-near-fore .runner-leg-lower {
    transform: rotate(6deg);
}

.in-stride .leg-far-fore {
    transform: rotate(16deg);
}

.in-stride .leg-far-fore .runner-leg-lower {
    transform: rotate(70deg);
}

.in-stride .leg-near-hind {
    transform: rotate(24deg);
}

.in-stride .leg-near-hind .runner-leg-lower {
    transform: rotate(4deg);
}

.in-stride .leg-far-hind {
    transform: rotate(-16deg);
}

.in-stride .leg-far-hind .runner-leg-lower {
    transform: rotate(-32deg);
}

.in-stride .runner-head {
    transform: rotate(3deg);
}

.in-stride .runner-tail {
    transform: rotate(-6deg);
}

@media (prefers-reduced-motion: no-preference) {
    .moving .runner-body,
    .moving .runner-head,
    .moving .runner-tail,
    .moving .runner-jockey,
    .moving .runner-shadow,
    .moving .runner-leg,
    .moving .runner-leg-lower {
        animation-duration: var(--duration-stride);
        animation-timing-function: ease-in-out;
        animation-delay: calc(
            var(--duration-stride) * (var(--stride-phase) + var(--leg-phase, 0)) * -1
        );
        animation-iteration-count: infinite;
    }

    .moving .runner-body {
        animation-name: runner-body;
    }

    .moving .runner-head {
        animation-name: runner-head;
    }

    .moving .runner-tail {
        animation-name: runner-tail;
    }

    .moving .runner-jockey {
        animation-name: runner-jockey;
    }

    .moving .runner-shadow {
        animation-name: runner-shadow;
    }

    .moving .leg-near-hind {
        --leg-phase: 0;

        animation-name: hind-upper;
    }

    .moving .leg-far-hind {
        --leg-phase: 0.08;

        animation-name: hind-upper;
    }

    .moving .leg-near-fore {
        --leg-phase: 0.52;

        animation-name: fore-upper;
    }

    .moving .leg-far-fore {
        --leg-phase: 0.6;

        animation-name: fore-upper;
    }

    .moving .leg-near-hind .runner-leg-lower,
    .moving .leg-far-hind .runner-leg-lower {
        animation-name: hind-lower;
    }

    .moving .leg-near-fore .runner-leg-lower,
    .moving .leg-far-fore .runner-leg-lower {
        animation-name: fore-lower;
    }
}

@keyframes fore-upper {
    0%,
    100% {
        transform: rotate(-32deg);
    }

    18% {
        transform: rotate(-8deg);
    }

    36% {
        transform: rotate(22deg);
    }

    50% {
        transform: rotate(26deg);
    }

    70% {
        transform: rotate(2deg);
    }

    88% {
        transform: rotate(-30deg);
    }
}

@keyframes fore-lower {
    0%,
    100% {
        transform: rotate(4deg);
    }

    18% {
        transform: rotate(0deg);
    }

    36% {
        transform: rotate(8deg);
    }

    50% {
        transform: rotate(55deg);
    }

    70% {
        transform: rotate(95deg);
    }

    88% {
        transform: rotate(35deg);
    }
}

@keyframes hind-upper {
    0%,
    100% {
        transform: rotate(28deg);
    }

    16% {
        transform: rotate(20deg);
    }

    36% {
        transform: rotate(-10deg);
    }

    55% {
        transform: rotate(-30deg);
    }

    72% {
        transform: rotate(-24deg);
    }

    88% {
        transform: rotate(6deg);
    }
}

@keyframes hind-lower {
    0%,
    100% {
        transform: rotate(6deg);
    }

    16% {
        transform: rotate(-18deg);
    }

    36% {
        transform: rotate(-42deg);
    }

    55% {
        transform: rotate(-20deg);
    }

    72% {
        transform: rotate(2deg);
    }

    88% {
        transform: rotate(4deg);
    }
}

@keyframes runner-body {
    0%,
    100% {
        transform: translateY(-0.2px) rotate(-0.4deg);
    }

    25% {
        transform: translateY(-1.3px) rotate(-1.4deg);
    }

    55% {
        transform: translateY(0.1px) rotate(0.2deg);
    }

    75% {
        transform: translateY(0.5px) rotate(1deg);
    }
}

@keyframes runner-head {
    0%,
    100% {
        transform: rotate(-1deg);
    }

    16% {
        transform: rotate(-5deg);
    }

    66% {
        transform: rotate(5deg);
    }
}

@keyframes runner-tail {
    0%,
    100% {
        transform: rotate(0deg);
    }

    25% {
        transform: rotate(-9deg);
    }

    75% {
        transform: rotate(6deg);
    }
}

@keyframes runner-jockey {
    0%,
    100% {
        transform: translateY(0.3px);
    }

    25% {
        transform: translateY(0.9px);
    }

    75% {
        transform: translateY(-0.4px);
    }
}

@keyframes runner-shadow {
    0%,
    100% {
        transform: scaleX(0.96);
    }

    25% {
        transform: scaleX(0.9);
    }

    75% {
        transform: scaleX(1);
    }
}
</style>
