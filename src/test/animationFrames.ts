import { vi } from 'vitest';

/** Replaces requestAnimationFrame with a queue that tests flush at explicit timestamps. */
export function stubAnimationFrames() {
    const pending = new Map<number, FrameRequestCallback>();
    let lastId = 0;

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        lastId += 1;
        pending.set(lastId, callback);
        return lastId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        pending.delete(id);
    });

    return {
        pendingCount: () => pending.size,
        frame(timestamp: number) {
            const callbacks = [...pending.values()];
            pending.clear();
            for (const callback of callbacks) {
                callback(timestamp);
            }
        },
    };
}
