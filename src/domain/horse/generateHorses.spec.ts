import { describe, expect, it } from 'vitest';

import { constantRng, LARGEST_DRAW, sequenceRng } from '@/test/stubRng';

import { createRng } from '../random/createRng';
import { generateHorses } from './generateHorses';
import { HORSE_NAMES, SILK_COLORS } from './horse.constants';
import type { Horse, HorseColor } from './horse.types';

const SEEDS = [0, 1, 42, 2026, 4294967295];
const ROSTERS_PER_SEED = 10;
const STATISTICS_SEED = 20260915;
const STATISTICS_ROSTERS = 1000;

// Design 3.1: a lowercase #rrggbb hex value.
const HEX_COLOR = /^#[\da-f]{6}$/;

// Rows are [draw, condition] for horses 1 to 20 in id order. Design 4.4 draws each condition with
// randomInt(1, 100, rng) = 1 + floor(draw * (100 - 1 + 1)) = 1 + floor(draw * 100).
const CONDITION_DRAWS: readonly (readonly [number, number])[] = [
    [0.5, 51], // 1 + floor(50)
    [0.125, 13], // 1 + floor(12.5)
    [0.875, 88], // 1 + floor(87.5)
    [0.03125, 4], // 1 + floor(3.125)
    [0.75, 76], // 1 + floor(75)
    [0.3125, 32], // 1 + floor(31.25)
    [0.96875, 97], // 1 + floor(96.875)
    [0.25, 26], // 1 + floor(25)
    [0.59375, 60], // 1 + floor(59.375)
    [0.0625, 7], // 1 + floor(6.25)
    [0.8125, 82], // 1 + floor(81.25)
    [0.40625, 41], // 1 + floor(40.625)
    [0.65625, 66], // 1 + floor(65.625)
    [0.1875, 19], // 1 + floor(18.75)
    [0.9375, 94], // 1 + floor(93.75)
    [0.375, 38], // 1 + floor(37.5)
    [0.53125, 54], // 1 + floor(53.125)
    [0.09375, 10], // 1 + floor(9.375)
    [0.71875, 72], // 1 + floor(71.875)
    [0.4375, 44], // 1 + floor(43.75)
];

function repeat<T>(value: T, count: number): T[] {
    return Array.from({ length: count }, () => value);
}

function generateRosters(seed: number, count: number): Horse[][] {
    const rng = createRng(seed);

    return Array.from({ length: count }, () => generateHorses(rng));
}

function seededRosters(): { seed: number; roster: number; horses: Horse[] }[] {
    return SEEDS.flatMap((seed) =>
        generateRosters(seed, ROSTERS_PER_SEED).map((horses, index) => ({
            seed,
            roster: index + 1,
            horses,
        }))
    );
}

function conditionsOf(rosters: readonly (readonly Horse[])[]): number[] {
    return rosters.flatMap((horses) => horses.map((horse) => horse.condition));
}

function sortColors(colors: readonly HorseColor[]): HorseColor[] {
    return [...colors].sort((a, b) => a.hex.localeCompare(b.hex) || a.name.localeCompare(b.name));
}

// The expected roster: horse n has id n and the nth name, color and condition.
function rosterOf(
    names: readonly string[],
    colors: readonly HorseColor[],
    conditions: readonly number[]
) {
    return names.map((name, index) => ({
        id: index + 1,
        name,
        color: colors[index],
        condition: conditions[index],
    }));
}

// WCAG 2.2 linearizes each sRGB channel over 255. The older 0.03928 threshold gives the same result,
// because no 8-bit channel value lies between 0.03928 and 0.04045.
function linearChannel(hex: string, start: number): number {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
    return (
        0.2126 * linearChannel(hex, 1) +
        0.7152 * linearChannel(hex, 3) +
        0.0722 * linearChannel(hex, 5)
    );
}

// WCAG 2.2 contrast ratio: (lighter + 0.05) / (darker + 0.05).
function contrastRatio(first: string, second: string): number {
    const firstLuminance = relativeLuminance(first);
    const secondLuminance = relativeLuminance(second);

    return (
        (Math.max(firstLuminance, secondLuminance) + 0.05) /
        (Math.min(firstLuminance, secondLuminance) + 0.05)
    );
}

describe('[HORSE-01] generateHorses roster size and ids', () => {
    it('returns exactly 20 horses across fixed seeds', () => {
        for (const { seed, roster, horses } of seededRosters()) {
            expect(horses, `seed ${seed}, roster ${roster}`).toHaveLength(20);
        }
    });

    it('numbers the horses 1 to 20 in order across fixed seeds', () => {
        const ids = Array.from({ length: 20 }, (_, index) => index + 1);

        for (const { seed, roster, horses } of seededRosters()) {
            expect(
                horses.map((horse) => horse.id),
                `seed ${seed}, roster ${roster}`
            ).toEqual(ids);
        }
    });
});

describe('[HORSE-02] generateHorses names and colors', () => {
    it('gives every horse in a roster a different name across fixed seeds', () => {
        for (const { seed, roster, horses } of seededRosters()) {
            expect(
                new Set(horses.map((horse) => horse.name)).size,
                `seed ${seed}, roster ${roster}`
            ).toBe(20);
        }
    });

    it('draws every name from HORSE_NAMES across fixed seeds', () => {
        for (const { seed, roster, horses } of seededRosters()) {
            expect(HORSE_NAMES, `seed ${seed}, roster ${roster}`).toEqual(
                expect.arrayContaining(horses.map((horse) => horse.name))
            );
        }
    });

    it('gives every horse in a roster a different color name and hex value across fixed seeds', () => {
        for (const { seed, roster, horses } of seededRosters()) {
            expect(
                new Set(horses.map((horse) => horse.color.name)).size,
                `seed ${seed}, roster ${roster}`
            ).toBe(20);
            expect(
                new Set(horses.map((horse) => horse.color.hex)).size,
                `seed ${seed}, roster ${roster}`
            ).toBe(20);
        }
    });

    it('uses each SILK_COLORS entry exactly once per roster across fixed seeds', () => {
        for (const { seed, roster, horses } of seededRosters()) {
            expect(
                sortColors(horses.map((horse) => horse.color)),
                `seed ${seed}, roster ${roster}`
            ).toEqual(sortColors(SILK_COLORS));
        }
    });
});

describe('[HORSE-02] HORSE_NAMES and SILK_COLORS', () => {
    it('holds exactly 40 names in HORSE_NAMES', () => {
        expect(HORSE_NAMES).toHaveLength(40);
    });

    it('holds only unique, non-blank names in HORSE_NAMES', () => {
        expect(HORSE_NAMES.filter((name) => name.trim() === '')).toEqual([]);
        expect(new Set(HORSE_NAMES).size).toBe(40);
    });

    it('holds exactly 20 colors in SILK_COLORS', () => {
        expect(SILK_COLORS).toHaveLength(20);
    });

    it('gives every silk color a unique, non-blank name', () => {
        const names = SILK_COLORS.map((color) => color.name);

        expect(names.filter((name) => name.trim() === '')).toEqual([]);
        expect(new Set(names).size).toBe(20);
    });

    it('gives every silk color a unique lowercase #rrggbb hex value', () => {
        const hexes = SILK_COLORS.map((color) => color.hex);

        expect(hexes.filter((hex) => !HEX_COLOR.test(hex))).toEqual([]);
        expect(new Set(hexes).size).toBe(20);
    });
});

describe('[NFR-01] silk bib contrast', () => {
    // Published ratios pin the local formula. Grays weigh the channels only by their sum, so pure
    // red, green and blue on black pin each weight with (weight + 0.05) / (0 + 0.05).
    it.each([
        ['#000000', '#ffffff', 21],
        ['#767676', '#ffffff', 4.54],
        ['#ff0000', '#000000', 5.252], // (0.2126 + 0.05) / 0.05
        ['#00ff00', '#000000', 15.304], // (0.7152 + 0.05) / 0.05
        ['#0000ff', '#000000', 2.444], // (0.0722 + 0.05) / 0.05
    ])('computes the contrast ratio of %s on %s as %s:1', (foreground, background, ratio) => {
        expect(contrastRatio(foreground, background)).toBeCloseTo(ratio, 2);
    });

    it('gives every silk color at least 4.5:1 against #151515 or #f5f5f5', () => {
        // Each failure names the color with its better ratio, truncated so it never prints as 4.50.
        const failures = SILK_COLORS.map(({ name, hex }) => ({
            name,
            hex,
            ratio: Math.max(contrastRatio(hex, '#151515'), contrastRatio(hex, '#f5f5f5')),
        }))
            .filter(({ ratio }) => ratio < 4.5)
            .map(
                ({ name, hex, ratio }) =>
                    `${name} ${hex}: ${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`
            );

        expect(failures).toEqual([]);
    });
});

describe('[HORSE-02] generateHorses name and color distribution', () => {
    it('includes each pool name within 5 standard errors of half the rosters', () => {
        // A roster draws 20 of the 40 names, so it includes a given name with p = 20 / 40 = 0.5.
        // Over n = 1000 rosters the count has mean 500 and standard error
        // sqrt(1000 * 0.5 * 0.5) = 15.81; 5 standard errors = 79.06.
        const rosters = generateRosters(STATISTICS_SEED, STATISTICS_ROSTERS);
        const probability = 20 / 40;
        const expected = STATISTICS_ROSTERS * probability;
        const tolerance = 5 * Math.sqrt(STATISTICS_ROSTERS * probability * (1 - probability));

        for (const name of HORSE_NAMES) {
            const inclusions = rosters.filter((horses) =>
                horses.some((horse) => horse.name === name)
            ).length;

            expect(inclusions, `name ${name}`).toBeGreaterThan(expected - tolerance);
            expect(inclusions, `name ${name}`).toBeLessThan(expected + tolerance);
        }
    });

    it('gives horse 1 each silk color within 5 standard errors of 1/20 of the rosters', () => {
        // A roster uses the 20 colors in a uniformly random order, so horse 1 gets a given color
        // with p = 1 / 20 = 0.05. Over n = 1000 rosters the count has mean 50 and standard error
        // sqrt(1000 * 0.05 * 0.95) = 6.89; 5 standard errors = 34.46.
        const rosters = generateRosters(STATISTICS_SEED, STATISTICS_ROSTERS);
        const probability = 1 / 20;
        const expected = STATISTICS_ROSTERS * probability;
        const tolerance = 5 * Math.sqrt(STATISTICS_ROSTERS * probability * (1 - probability));

        for (const color of SILK_COLORS) {
            const firsts = rosters.filter((horses) => horses[0]?.color.hex === color.hex).length;

            expect(firsts, `color ${color.name}`).toBeGreaterThan(expected - tolerance);
            expect(firsts, `color ${color.name}`).toBeLessThan(expected + tolerance);
        }
    });
});

describe('[HORSE-03] generateHorses conditions', () => {
    it('gives every horse an integer condition from 1 to 100 across fixed seeds', () => {
        const conditions = conditionsOf(seededRosters().map(({ horses }) => horses));

        expect(
            conditions.filter(
                (condition) => !Number.isInteger(condition) || condition < 1 || condition > 100
            )
        ).toEqual([]);
    });

    it('gives every horse condition 1 when every draw is 0', () => {
        expect(generateHorses(constantRng(0)).map((horse) => horse.condition)).toEqual(
            repeat(1, 20)
        );
    });

    it('gives every horse condition 100 when every draw is the largest', () => {
        expect(generateHorses(constantRng(LARGEST_DRAW)).map((horse) => horse.condition)).toEqual(
            repeat(100, 20)
        );
    });

    it('keeps the mean condition of 1000 rosters within 5 standard errors of 50.5', () => {
        // A uniform integer from 1 to 100 has mean 50.5 and variance (100^2 - 1) / 12 = 833.25, so
        // the mean of n = 20 * 1000 = 20000 conditions has standard error
        // sqrt(833.25 / 20000) = 0.2041; 5 standard errors = 1.0206.
        const count = 20 * STATISTICS_ROSTERS;
        const conditions = conditionsOf(generateRosters(STATISTICS_SEED, STATISTICS_ROSTERS));
        const mean = conditions.reduce((sum, condition) => sum + condition, 0) / count;
        const standardError = Math.sqrt(833.25 / count);

        expect(Math.abs(mean - 50.5)).toBeLessThan(5 * standardError);
    });

    it('reaches both condition bounds over 1000 rosters', () => {
        const conditions = conditionsOf(generateRosters(STATISTICS_SEED, STATISTICS_ROSTERS));

        expect(conditions).toContain(1);
        expect(conditions).toContain(100);
    });
});

describe('[NFR-03] generateHorses draw order with a stubbed generator', () => {
    it('gives horse n pool name n, silk color n and condition 1 when every draw is 0', () => {
        // Every sample takes index floor(0 * remaining) = 0, the first entry not drawn yet, and
        // every condition is 1 + floor(0 * 100) = 1.
        expect(generateHorses(constantRng(0))).toEqual(
            rosterOf(HORSE_NAMES.slice(0, 20), SILK_COLORS, repeat(1, 20))
        );
    });

    it('gives horse n pool name 41 - n, silk color 21 - n and condition 100 for the largest draw', () => {
        // Every sample takes index floor(LARGEST_DRAW * remaining) = remaining - 1, the last entry
        // not drawn yet, and every condition is 1 + floor(LARGEST_DRAW * 100) = 1 + 99 = 100.
        expect(generateHorses(constantRng(LARGEST_DRAW))).toEqual(
            rosterOf(HORSE_NAMES.slice(-20).reverse(), [...SILK_COLORS].reverse(), repeat(100, 20))
        );
    });

    it('draws 20 names, then the order of the 20 colors, then conditions in id order', () => {
        // Draws 1 to 20 are 0, so horse n gets pool name n. Draws 21 to 40 are the largest draw, so
        // horse n gets silk color 21 - n. Draws 41 to 60 are CONDITION_DRAWS for horses 1 to 20.
        // Consuming the blocks in any other order changes the names, the colors or the conditions.
        const rng = sequenceRng([
            ...repeat(0, 20),
            ...repeat(LARGEST_DRAW, 20),
            ...CONDITION_DRAWS.map(([draw]) => draw),
        ]);

        expect(generateHorses(rng)).toEqual(
            rosterOf(
                HORSE_NAMES.slice(0, 20),
                [...SILK_COLORS].reverse(),
                CONDITION_DRAWS.map(([, condition]) => condition)
            )
        );
    });
});

describe('[NFR-03] generateHorses determinism', () => {
    it('returns deep-equal rosters for the same seed', () => {
        for (const seed of SEEDS) {
            expect(generateRosters(seed, ROSTERS_PER_SEED), `seed ${seed}`).toEqual(
                generateRosters(seed, ROSTERS_PER_SEED)
            );
        }
    });

    it('returns different rosters for different seeds', () => {
        const rosters = SEEDS.map((seed) => JSON.stringify(generateHorses(createRng(seed))));

        expect(new Set(rosters).size).toBe(SEEDS.length);
    });

    it.each([0, 0.5, LARGEST_DRAW])('consumes exactly 60 draws when every draw is %s', (draw) => {
        const rng = sequenceRng(repeat(draw, 60));

        generateHorses(rng);

        expect(() => rng.next()).toThrow(/exhausted/);
    });
});
