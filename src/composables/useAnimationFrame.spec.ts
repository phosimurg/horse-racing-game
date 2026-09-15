import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { MAX_FRAME_DELTA_MS } from '@/domain';
import { stubAnimationFrames } from '@/test/animationFrames';

import { useAnimationFrame } from './useAnimationFrame';

type Loop = ReturnType<typeof useAnimationFrame>;

afterEach(() => {
    vi.unstubAllGlobals();
});

function setup() {
    const frames = stubAnimationFrames();
    const deltas: number[] = [];
    const scope = effectScope();
    const loop = scope.run(() => useAnimationFrame((deltaMs) => deltas.push(deltaMs))) as Loop;
    return { frames, deltas, scope, loop };
}

describe('[RACE-05] useAnimationFrame deltas', () => {
    it('reports 0 for the first frame and the time since the previous frame afterwards', () => {
        const { frames, deltas, loop } = setup();

        loop.start();
        frames.frame(1000);
        frames.frame(1016);
        frames.frame(1049);

        expect(deltas).toEqual([0, 16, 33]);
    });

    it('caps a delayed frame at MAX_FRAME_DELTA_MS', () => {
        const { frames, deltas, loop } = setup();

        loop.start();
        frames.frame(1000);
        frames.frame(61000);

        expect(deltas).toEqual([0, MAX_FRAME_DELTA_MS]);
    });

    it('never reports a negative delta', () => {
        const { frames, deltas, loop } = setup();

        loop.start();
        frames.frame(1000);
        frames.frame(900);

        expect(deltas).toEqual([0, 0]);
    });
});

describe('[RACE-03] useAnimationFrame start and stop', () => {
    it('stops requesting frames on stop and restarts with a zero delta', () => {
        const { frames, deltas, loop } = setup();

        loop.start();
        frames.frame(1000);
        frames.frame(1016);
        loop.stop();

        expect(frames.pendingCount()).toBe(0);
        expect(loop.isRunning.value).toBe(false);

        loop.start();
        frames.frame(5000);
        frames.frame(5016);

        expect(deltas).toEqual([0, 16, 0, 16]);
    });

    it('ignores a second start while running', () => {
        const { frames, deltas, loop } = setup();

        loop.start();
        loop.start();
        frames.frame(1000);

        expect(deltas).toEqual([0]);
        expect(frames.pendingCount()).toBe(1);
    });

    it('does not request another frame when the callback stops the loop', () => {
        const frames = stubAnimationFrames();
        const scope = effectScope();
        const loop = scope.run(() => {
            const created = useAnimationFrame(() => created.stop());
            return created;
        }) as Loop;

        loop.start();
        frames.frame(1000);

        expect(frames.pendingCount()).toBe(0);
    });

    it('stops when its scope is disposed', () => {
        const { frames, scope, loop } = setup();

        loop.start();
        scope.stop();

        expect(frames.pendingCount()).toBe(0);
    });
});
