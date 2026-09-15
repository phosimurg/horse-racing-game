import { computed, shallowRef, watchSyncEffect } from 'vue';

import { useMediaQuery } from './useMediaQuery';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'horse-racing-theme';

export function useTheme() {
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const chosen = shallowRef<Theme | null>(readStoredTheme());
    const theme = computed<Theme>(() => chosen.value ?? (prefersDark.value ? 'dark' : 'light'));

    function setTheme(next: Theme): void {
        chosen.value = next;
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Storage can be unavailable, for example in private browsing; the choice still applies.
        }
    }

    function toggleTheme(): void {
        setTheme(theme.value === 'dark' ? 'light' : 'dark');
    }

    watchSyncEffect(() => {
        document.documentElement.dataset.theme = theme.value;
    });

    return { theme, setTheme, toggleTheme };
}

function readStoredTheme(): Theme | null {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
        return null;
    }
}
