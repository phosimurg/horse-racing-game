import { onScopeDispose, readonly, shallowRef } from 'vue';

export function useMediaQuery(query: string) {
    const mediaQueryList = window.matchMedia(query);
    const matches = shallowRef(mediaQueryList.matches);
    const update = (event: MediaQueryListEvent): void => {
        matches.value = event.matches;
    };

    mediaQueryList.addEventListener('change', update);
    onScopeDispose(() => {
        mediaQueryList.removeEventListener('change', update);
    });

    return readonly(matches);
}
