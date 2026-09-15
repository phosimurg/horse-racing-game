import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { stubMatchMedia } from '@/test/matchMedia';

import { useMediaQuery } from './useMediaQuery';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('[UX-03] useMediaQuery', () => {
    it('reads the current match of the given query', () => {
        const media = stubMatchMedia(true);
        const scope = effectScope();

        const matches = scope.run(() => useMediaQuery('(max-width: 767px)'));

        expect(media.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
        expect(matches?.value).toBe(true);
    });

    it('follows changes of the media query', () => {
        const media = stubMatchMedia(false);
        const scope = effectScope();
        const matches = scope.run(() => useMediaQuery('(max-width: 767px)'));

        media.change(true);

        expect(matches?.value).toBe(true);
    });

    it('stops listening when its scope is disposed', () => {
        const media = stubMatchMedia(false);
        const scope = effectScope();
        scope.run(() => useMediaQuery('(max-width: 767px)'));

        scope.stop();

        expect(media.listenerCount()).toBe(0);
    });
});
