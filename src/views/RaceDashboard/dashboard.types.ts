export type LapState = 'upcoming' | 'live' | 'finished';

export interface LapStep {
    readonly number: number;
    readonly distance: number;
    readonly state: LapState;
}
