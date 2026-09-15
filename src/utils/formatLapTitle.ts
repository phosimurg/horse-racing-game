const ORDINAL_SUFFIXES = ['TH', 'ST', 'ND', 'RD'];

function ordinal(value: number): string {
    const lastTwoDigits = value % 100;
    const suffix =
        lastTwoDigits >= 11 && lastTwoDigits <= 13 ? 'TH' : (ORDINAL_SUFFIXES[value % 10] ?? 'TH');
    return `${value}${suffix}`;
}

/** The brief's lap label, for example "1ST Lap - 1200m". */
export function formatLapTitle(roundNumber: number, distance: number): string {
    return `${ordinal(roundNumber)} Lap - ${distance}m`;
}

/** The track banner, for example "LAP 3/6 - 1600 M". */
export function formatLapBanner(roundNumber: number, roundCount: number, distance: number): string {
    return `LAP ${roundNumber}/${roundCount} - ${distance} M`;
}
