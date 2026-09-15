import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrastRatio } from '@/utils/contrastRatio';

type Theme = 'light' | 'dark';

// Read from disk: Vitest replaces CSS modules, even ?raw imports, with empty strings.
const CSS = readFileSync('src/styles/tokens.css', 'utf8');

const TOKEN =
    /--color-([\w-]+):\s*(?:light-dark\((#[\da-f]{3,6}),\s*(#[\da-f]{3,6})\)|(#[\da-f]{3,6}));/gi;
const TOKENS = new Map(
    [...CSS.matchAll(TOKEN)].map(([, name, light, dark, both]) => [
        name,
        { light: light ?? both, dark: dark ?? both },
    ])
);

// [foreground, background, minimum ratio]: text needs 4.5:1, UI boundaries and focus rings 3:1.
const PAIRS: [string, string, number][] = [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surface-raised', 4.5],
    ['text-muted', 'bg', 4.5],
    ['text-muted', 'surface', 4.5],
    ['text-muted', 'surface-raised', 4.5],
    ['accent-ink', 'accent', 4.5],
    ['accent-border', 'bg', 3],
    ['accent-border', 'surface', 3],
    ['focus', 'bg', 3],
    ['focus', 'surface', 3],
    ['lane-ink', 'turf', 4.5],
    ['lane-ink', 'turf-stripe', 4.5],
    ['podium-ink', 'gold', 4.5],
    ['podium-ink', 'silver', 4.5],
    ['podium-ink', 'bronze', 4.5],
];

function token(theme: Theme, name: string): string {
    const value = TOKENS.get(name)?.[theme];
    if (!value) {
        throw new Error(`Missing color token --color-${name}`);
    }
    return value;
}

describe('[NFR-01] color token contrast', () => {
    it.each(['light', 'dark'] satisfies Theme[])('meets the minimums in the %s theme', (theme) => {
        const failures = PAIRS.map(([foreground, background, minimum]) => ({
            pair: `${foreground} on ${background}`,
            ratio: contrastRatio(token(theme, foreground), token(theme, background)),
            minimum,
        })).filter(({ ratio, minimum }) => ratio < minimum);

        expect(failures).toEqual([]);
    });
});
