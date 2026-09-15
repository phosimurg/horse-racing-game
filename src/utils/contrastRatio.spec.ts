import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance } from './contrastRatio';

describe('[NFR-01] contrastRatio', () => {
    it.each([
        ['#000000', '#ffffff', 21],
        ['#fff', '#000', 21],
        ['#767676', '#ffffff', 4.54],
        ['#ffffff', '#767676', 4.54],
    ])('rates %s against %s at %s:1', (first, second, ratio) => {
        expect(contrastRatio(first, second)).toBeCloseTo(ratio, 2);
    });

    it('expands short hex colors', () => {
        expect(relativeLuminance('#abc')).toBe(relativeLuminance('#aabbcc'));
    });

    it.each(['red', '#12345', '#gggggg', ''])('rejects the color %j', (color) => {
        expect(() => relativeLuminance(color)).toThrow(
            /^relativeLuminance: expected a #rgb or #rrggbb color/
        );
    });
});
