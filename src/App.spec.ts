import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RNG_KEY } from '@/composables/useRng';
import { createRng } from '@/domain';
import { stubAnimationFrames } from '@/test/animationFrames';
import { stubMatchMedia } from '@/test/matchMedia';

import App from './App.vue';

afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
});

describe('App', () => {
    it('renders the race dashboard with the application title as the main heading', () => {
        stubMatchMedia(false);
        stubAnimationFrames();

        const wrapper = mount(App, {
            global: { plugins: [createPinia()], provide: { [RNG_KEY]: createRng(1) } },
        });

        expect(wrapper.get('h1').text()).toBe('Horse Racing');
        expect(wrapper.find('main').exists()).toBe(true);
        wrapper.unmount();
    });
});
