import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from './App.vue';

describe('App', () => {
    it('renders the application title as the main heading', () => {
        const wrapper = mount(App);

        expect(wrapper.get('main h1').text()).toBe('Horse Racing');
    });
});
