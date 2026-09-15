import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import BaseButton from './BaseButton.vue';

// Vue Test Utils cannot set the read-only click count, so dispatch a real MouseEvent.
async function click(wrapper: VueWrapper, detail: number): Promise<void> {
    wrapper.element.dispatchEvent(new MouseEvent('click', { detail, bubbles: true }));
    await nextTick();
}

function mountButton(props = {}) {
    return mount(BaseButton, { props, slots: { default: 'Start' } });
}

describe('[CTRL-02] BaseButton activation', () => {
    it('emits activate once for a single click', async () => {
        const wrapper = mountButton();

        await click(wrapper, 1);

        expect(wrapper.emitted('activate')).toHaveLength(1);
    });

    it('ignores the extra click of a double click', async () => {
        const wrapper = mountButton();

        await click(wrapper, 1);
        await click(wrapper, 2);

        expect(wrapper.emitted('activate')).toHaveLength(1);
    });

    it('emits activate for a keyboard click, which carries no click count', async () => {
        const wrapper = mountButton();

        await click(wrapper, 0);

        expect(wrapper.emitted('activate')).toHaveLength(1);
    });

    it.each(['Enter', ' '])('cancels a held %j key but not its first press', (key) => {
        const wrapper = mountButton();
        const first = new KeyboardEvent('keydown', { key, cancelable: true });
        const repeated = new KeyboardEvent('keydown', { key, repeat: true, cancelable: true });

        wrapper.element.dispatchEvent(first);
        wrapper.element.dispatchEvent(repeated);

        expect([first.defaultPrevented, repeated.defaultPrevented]).toEqual([false, true]);
    });
});

describe('[CTRL-01] BaseButton state', () => {
    it('renders a native button that can be disabled', () => {
        const wrapper = mountButton({ disabled: true });

        expect(wrapper.element.tagName).toBe('BUTTON');
        expect(wrapper.attributes('type')).toBe('button');
        expect((wrapper.element as HTMLButtonElement).disabled).toBe(true);
    });
});
