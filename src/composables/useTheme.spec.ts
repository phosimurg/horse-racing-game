import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { stubMatchMedia } from '@/test/matchMedia';

import { THEME_STORAGE_KEY, useTheme } from './useTheme';

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
});

function setup(prefersDark: boolean) {
    const media = stubMatchMedia(prefersDark);
    const scope = effectScope();
    const themeApi = scope.run(() => useTheme()) as ReturnType<typeof useTheme>;
    return { media, ...themeApi };
}

describe('[UX-02] useTheme', () => {
    it.each([
        [true, 'dark'],
        [false, 'light'],
    ] as const)(
        'follows the system scheme on a first visit (prefers dark: %s)',
        (prefersDark, theme) => {
            const api = setup(prefersDark);

            expect(api.theme.value).toBe(theme);
            expect(document.documentElement.dataset.theme).toBe(theme);
        }
    );

    it('follows system changes while no theme is chosen', () => {
        const api = setup(false);

        api.media.change(true);

        expect(api.theme.value).toBe('dark');
    });

    it('switches the theme, applies it and remembers it', () => {
        const api = setup(false);

        api.toggleTheme();

        expect(api.theme.value).toBe('dark');
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('restores the chosen theme on a later visit over the system scheme', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
        const api = setup(true);

        api.media.change(true);

        expect(api.theme.value).toBe('light');
    });

    it('ignores an unknown stored value', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'purple');

        expect(setup(true).theme.value).toBe('dark');
    });

    it('keeps working when storage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage denied');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage denied');
        });
        const api = setup(false);

        api.setTheme('dark');

        expect(api.theme.value).toBe('dark');
    });
});
