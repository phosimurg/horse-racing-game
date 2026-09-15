import { onScopeDispose, readonly, shallowRef } from 'vue';

import { MAX_FRAME_DELTA_MS } from '@/domain';

export function useAnimationFrame(onFrame: (deltaMs: number) => void) {
    const isRunning = shallowRef(false);
    let frameId: number | null = null;
    let lastTimestamp: number | null = null;

    function tick(timestamp: number): void {
        const elapsedMs = lastTimestamp === null ? 0 : timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        frameId = null;
        onFrame(Math.min(Math.max(elapsedMs, 0), MAX_FRAME_DELTA_MS));
        if (isRunning.value) {
            frameId = requestAnimationFrame(tick);
        }
    }

    function start(): void {
        if (isRunning.value) {
            return;
        }
        isRunning.value = true;
        lastTimestamp = null;
        frameId = requestAnimationFrame(tick);
    }

    function stop(): void {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
        isRunning.value = false;
        lastTimestamp = null;
    }

    onScopeDispose(stop);

    return { isRunning: readonly(isRunning), start, stop };
}
