const UINT32_MAX = 4294967295;
const DECIMAL_DIGITS = /^\d+$/;

export function resolveSeed(search: string, fallbackSeed: () => number = randomSeed): number {
    const value = new URLSearchParams(search).get('seed') ?? '';
    const seed = Number(value);

    return DECIMAL_DIGITS.test(value) && seed <= UINT32_MAX ? seed : fallbackSeed();
}

function randomSeed(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}
