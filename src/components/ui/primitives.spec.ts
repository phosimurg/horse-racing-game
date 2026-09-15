import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseBadge from './BaseBadge.vue';
import BaseCard from './BaseCard.vue';
import BaseIcon from './BaseIcon.vue';
import BaseTable from './BaseTable.vue';
import LiveAnnouncer from './LiveAnnouncer.vue';
import SkipLink from './SkipLink.vue';

describe('[NFR-01] BaseCard', () => {
    it.each([
        [undefined, 'H2'],
        [3, 'H3'],
    ] as const)('labels its section with a heading (level %s gives %s)', (headingLevel, tag) => {
        const wrapper = mount(BaseCard, {
            props: { title: 'Program', ...(headingLevel ? { headingLevel } : {}) },
            slots: { default: 'Body' },
        });
        const heading = wrapper.get('.base-card-title');

        expect(wrapper.element.tagName).toBe('SECTION');
        expect(heading.element.tagName).toBe(tag);
        expect(heading.text()).toBe('Program');
        expect(wrapper.attributes('aria-labelledby')).toBe(heading.attributes('id'));
    });
});

describe('[RES-01] BaseTable', () => {
    it('renders a captioned table with column headers and cell slots', () => {
        const wrapper = mount(BaseTable, {
            props: {
                caption: 'Lap 1 results',
                columns: [
                    { key: 'position', label: 'Position', numeric: true },
                    { key: 'name', label: 'Name' },
                ],
                rows: [
                    { position: 1, name: 'Ada Lovelace' },
                    { position: 2, name: 'Alan Turing' },
                ],
                rowKey: (row: object) => String((row as { position: number }).position),
            },
            slots: { 'cell-name': '<strong>{{ params.row.name }}</strong>' },
        });

        expect(wrapper.get('caption').text()).toBe('Lap 1 results');
        expect(wrapper.findAll('th').map((th) => [th.text(), th.attributes('scope')])).toEqual([
            ['Position', 'col'],
            ['Name', 'col'],
        ]);
        expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual([
            '1Ada Lovelace',
            '2Alan Turing',
        ]);
        expect(wrapper.find('tbody strong').text()).toBe('Ada Lovelace');
    });
});

describe('[NFR-01] accessibility primitives', () => {
    it('announces messages through one polite status region', () => {
        const wrapper = mount(LiveAnnouncer, { props: { message: 'Race paused.' } });

        expect(wrapper.attributes()).toMatchObject({
            role: 'status',
            'aria-live': 'polite',
            'aria-atomic': 'true',
        });
        expect(wrapper.text()).toBe('Race paused.');
    });

    it('links the skip link to its target', () => {
        const wrapper = mount(SkipLink, {
            props: { target: 'race-track' },
            slots: { default: 'Skip to the race track' },
        });

        expect(wrapper.attributes('href')).toBe('#race-track');
        expect(wrapper.text()).toBe('Skip to the race track');
    });

    it('hides decorative icons from assistive technology', () => {
        const wrapper = mount(BaseIcon, { props: { name: 'trophy' } });

        expect(wrapper.attributes()).toMatchObject({ 'aria-hidden': 'true', focusable: 'false' });
        expect(wrapper.find('path, rect, circle').exists()).toBe(true);
    });

    it('shows badge text with its tone', () => {
        const wrapper = mount(BaseBadge, { props: { tone: 'gold' }, slots: { default: '1st' } });

        expect(wrapper.text()).toBe('1st');
        expect(wrapper.classes()).toContain('tone-gold');
    });
});
