export interface Rng {
    /** Returns the next value in [0, 1). */
    next(): number;
}
