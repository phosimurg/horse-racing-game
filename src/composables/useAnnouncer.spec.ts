import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { ANNOUNCE_DELAY_MS, useAnnouncer } from './useAnnouncer';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function setup() {
    const scope = effectScope();
    const announcer = scope.run(() => useAnnouncer()) as ReturnType<typeof useAnnouncer>;
    return { scope, ...announcer };
}

describe('[NFR-01] useAnnouncer', () => {
    it('clears the live region and then announces the message', () => {
        const { message, announce } = setup();

        announce('Race started. Lap 1, 1200 meters.');

        expect(message.value).toBe('');
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
        expect(message.value).toBe('Race started. Lap 1, 1200 meters.');
    });

    it('announces an identical message again by clearing it first', () => {
        const { message, announce } = setup();
        announce('Race paused.');
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);

        announce('Race paused.');

        expect(message.value).toBe('');
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
        expect(message.value).toBe('Race paused.');
    });

    it('replaces a pending message with a newer one', () => {
        const { message, announce } = setup();

        announce('Race paused.');
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS - 1);
        announce('Race resumed.');
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS - 1);

        expect(message.value).toBe('');
        vi.advanceTimersByTime(1);
        expect(message.value).toBe('Race resumed.');
    });

    it('drops a pending message when its scope is disposed', () => {
        const { scope, message, announce } = setup();

        announce('Race paused.');
        scope.stop();
        vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);

        expect(message.value).toBe('');
    });
});
