export const HORSES_PER_ROUND = 10;
export const ROUND_DISTANCES_M: readonly number[] = [1200, 1400, 1600, 1800, 2000, 2200];

export const SEGMENT_LENGTH_M = 100;
export const BASE_SPEED_MPS = 16;
/** Share of BASE_SPEED_MPS a horse keeps at condition 0. */
export const MIN_CONDITION_FACTOR = 0.82;
export const FORM_VARIANCE = 0.02;
export const SEGMENT_JITTER = 0.05;
/** Simulated seconds per real second. */
export const PLAYBACK_SPEED = 18;

export const INTERMISSION_MS = 1500;
/** Upper bound for one animation frame's time step. */
export const MAX_FRAME_DELTA_MS = 100;
