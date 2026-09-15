import { onScopeDispose, readonly, shallowRef } from 'vue';

/** Gap between clearing and setting a message, so screen readers repeat identical messages. */
export const ANNOUNCE_DELAY_MS = 100;

export function useAnnouncer() {
    const message = shallowRef('');
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;

    function announce(text: string): void {
        clearTimeout(pendingTimer);
        message.value = '';
        pendingTimer = setTimeout(() => {
            message.value = text;
        }, ANNOUNCE_DELAY_MS);
    }

    onScopeDispose(() => {
        clearTimeout(pendingTimer);
    });

    return { message: readonly(message), announce };
}
