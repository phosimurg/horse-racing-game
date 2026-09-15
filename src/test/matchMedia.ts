import { vi } from 'vitest';

type ChangeListener = (event: { matches: boolean }) => void;

/** Replaces window.matchMedia with one media query list whose match a test can change. */
export function stubMatchMedia(matches: boolean) {
    const listeners = new Set<ChangeListener>();
    const mediaQueryList = {
        matches,
        addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
        removeEventListener: (_type: string, listener: ChangeListener) =>
            listeners.delete(listener),
    };
    const matchMedia = vi.fn<(query: string) => typeof mediaQueryList>(() => mediaQueryList);
    vi.stubGlobal('matchMedia', matchMedia);

    return {
        matchMedia,
        listenerCount: () => listeners.size,
        change(next: boolean) {
            mediaQueryList.matches = next;
            for (const listener of listeners) {
                listener({ matches: next });
            }
        },
    };
}
