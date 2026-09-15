import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import BaseTabs from './BaseTabs.vue';

const TABS = [
    { id: 'horses', label: 'Horses' },
    { id: 'program', label: 'Program' },
    { id: 'results', label: 'Results' },
];

let wrapper: VueWrapper | undefined;

afterEach(() => {
    wrapper?.unmount();
});

function mountTabs(selected = 'horses') {
    const mounted = mount(BaseTabs, {
        props: {
            tabs: TABS,
            label: 'Race panels',
            modelValue: selected,
            'onUpdate:modelValue': (value: string) => mounted.setProps({ modelValue: value }),
        },
        slots: { horses: 'Horse list', program: 'Program list', results: 'Results list' },
        attachTo: document.body,
    });
    wrapper = mounted;
    return mounted;
}

function tabs(mounted: VueWrapper) {
    return mounted.findAll('[role="tab"]');
}

describe('[UX-03] BaseTabs', () => {
    it('links each tab to its panel and shows only the selected panel', () => {
        const mounted = mountTabs();
        const [first, second] = tabs(mounted);
        const panels = mounted.findAll('[role="tabpanel"]');

        expect(mounted.get('[role="tablist"]').attributes('aria-label')).toBe('Race panels');
        expect(first?.attributes()).toMatchObject({ 'aria-selected': 'true', tabindex: '0' });
        expect(second?.attributes()).toMatchObject({ 'aria-selected': 'false', tabindex: '-1' });
        expect(first?.attributes('aria-controls')).toBe(panels[0]?.attributes('id'));
        expect(panels[0]?.attributes('aria-labelledby')).toBe(first?.attributes('id'));
        expect(panels.map((panel) => panel.isVisible())).toEqual([true, false, false]);
    });

    it('selects a tab on click', async () => {
        const mounted = mountTabs();

        await tabs(mounted)[2]?.trigger('click');

        expect(mounted.props('modelValue')).toBe('results');
    });

    it.each([
        ['horses', 'ArrowRight', 'program', 1],
        ['results', 'ArrowRight', 'horses', 0],
        ['horses', 'ArrowLeft', 'results', 2],
        ['results', 'Home', 'horses', 0],
        ['horses', 'End', 'results', 2],
    ])('from %s moves with %s to %s and focuses it', async (start, key, next, index) => {
        const mounted = mountTabs(start);
        const current = tabs(mounted).find((tab) => tab.attributes('aria-selected') === 'true');

        await current?.trigger('keydown', { key });

        expect(mounted.props('modelValue')).toBe(next);
        expect(document.activeElement).toBe(tabs(mounted)[index]?.element);
    });
});
