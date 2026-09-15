import { describe, expect, it } from 'vitest';

import { formatLapBanner, formatLapTitle } from './formatLapTitle';

describe('[PROG-04] formatLapTitle', () => {
    it.each([
        [1, 1200, '1ST Lap - 1200m'],
        [2, 1400, '2ND Lap - 1400m'],
        [3, 1600, '3RD Lap - 1600m'],
        [4, 1800, '4TH Lap - 1800m'],
        [5, 2000, '5TH Lap - 2000m'],
        [6, 2200, '6TH Lap - 2200m'],
    ])('titles round %s over %s m as %j', (roundNumber, distance, title) => {
        expect(formatLapTitle(roundNumber, distance)).toBe(title);
    });

    it.each([
        [11, '11TH'],
        [12, '12TH'],
        [13, '13TH'],
        [21, '21ST'],
        [22, '22ND'],
        [23, '23RD'],
    ])('uses the English ordinal for round %s', (roundNumber, ordinal) => {
        expect(formatLapTitle(roundNumber, 1000)).toBe(`${ordinal} Lap - 1000m`);
    });
});

describe('[RACE-02] formatLapBanner', () => {
    it('shows the lap, the lap count and the distance', () => {
        expect(formatLapBanner(3, 6, 1600)).toBe('LAP 3/6 - 1600 M');
    });
});
