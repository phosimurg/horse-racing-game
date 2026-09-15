import { describe, expect, it } from 'vitest';

import { SILK_COLORS } from '@/domain';

import { contrastRatio } from './contrastRatio';
import { DARK_TEXT, LIGHT_TEXT, readableTextColor } from './readableTextColor';

describe('[NFR-01] readableTextColor', () => {
    it.each([
        ['#0b1020', LIGHT_TEXT],
        ['#f7ee55', DARK_TEXT],
    ])('picks readable text for %s', (background, text) => {
        expect(readableTextColor(background)).toBe(text);
    });

    it('gives every silk color bib text of at least 4.5:1', () => {
        const failures = SILK_COLORS.filter(
            ({ hex }) => contrastRatio(hex, readableTextColor(hex)) < 4.5
        ).map(({ name }) => name);

        expect(failures).toEqual([]);
    });
});
