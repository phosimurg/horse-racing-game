import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { createRng, generateHorses, SILK_COLORS } from '@/domain';
import { contrastRatio } from '@/utils/contrastRatio';

import ConditionMeter from './ConditionMeter.vue';
import HorseRunner from './HorseRunner.vue';
import RoundCard from './RoundCard.vue';
import SilkChip from './SilkChip.vue';
import ThemeToggle from './ThemeToggle.vue';

// Vue Test Utils cannot set the read-only click count, so dispatch a real MouseEvent.
async function click(wrapper: VueWrapper, detail: number): Promise<void> {
    wrapper.element.dispatchEvent(new MouseEvent('click', { detail, bubbles: true }));
    await nextTick();
}

const HORSES = generateHorses(createRng(7));
const HORSES_BY_ID = new Map(HORSES.map((horse) => [horse.id, horse]));
const ROUND = { number: 1, distance: 1200, horseIds: HORSES.slice(0, 10).map((horse) => horse.id) };

describe('[HORSE-02] SilkChip', () => {
    it('names the silk color and prints a readable bib on every silk', () => {
        const failures = SILK_COLORS.filter((color) => {
            const style = mount(SilkChip, { props: { color, bib: 7 } })
                .get('.silk-chip-swatch')
                .attributes('style');
            const ink = /--silk-ink:\s*(#[\da-f]{6})/i.exec(style ?? '')?.[1] ?? '';
            return contrastRatio(color.hex, ink) < 4.5;
        });

        const wrapper = mount(SilkChip, { props: { color: SILK_COLORS[0]!, bib: 7 } });
        expect(failures).toEqual([]);
        expect(wrapper.text()).toBe(`7${SILK_COLORS[0]?.name}`);
        expect(wrapper.get('.silk-chip-swatch').attributes('aria-hidden')).toBe('true');
    });
});

describe('[HORSE-03] ConditionMeter', () => {
    it('exposes the condition as a meter from 1 to 100', () => {
        const wrapper = mount(ConditionMeter, {
            props: { condition: 64, label: 'Condition of Ada Lovelace' },
        });
        const meter = wrapper.get('meter');

        expect(meter.attributes()).toMatchObject({
            min: '1',
            max: '100',
            'aria-label': 'Condition of Ada Lovelace',
        });
        expect((meter.element as HTMLMeterElement).value).toBe(64);
        expect(wrapper.text()).toBe('64');
    });
});

describe('[NFR-01] HorseRunner', () => {
    it('is decorative and prints a readable bib number', () => {
        const color = SILK_COLORS[4]!;
        const wrapper = mount(HorseRunner, { props: { color, bib: 12 } });
        const bib = wrapper.get('text');

        expect(wrapper.attributes('aria-hidden')).toBe('true');
        expect(bib.text()).toBe('12');
        expect(
            contrastRatio(color?.hex ?? '', bib.attributes('fill') ?? '')
        ).toBeGreaterThanOrEqual(4.5);
    });

    it('stands at the start gate, holds a stride elsewhere and gallops only while moving', () => {
        const color = SILK_COLORS[4]!;
        const classesOf = (props: { atGate?: boolean; moving?: boolean }) =>
            mount(HorseRunner, { props: { color, bib: 3, ...props } }).classes();

        expect(classesOf({ atGate: true })).not.toContain('in-stride');
        expect(classesOf({})).toContain('in-stride');
        expect(classesOf({})).not.toContain('moving');
        expect(classesOf({ moving: true })).toContain('moving');
    });
});

describe('[PROG-04] RoundCard', () => {
    it('lists the lap title, its state and the lane order with names', () => {
        const wrapper = mount(RoundCard, {
            props: { round: ROUND, horsesById: HORSES_BY_ID, state: 'upcoming' },
        });

        expect(wrapper.get('h3').text()).toBe('1ST Lap - 1200m');
        expect(wrapper.text()).toContain('Upcoming');
        expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Position', 'Name']);
        expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(
            ROUND.horseIds.map((id, index) => `${index + 1}${HORSES_BY_ID.get(id)?.name}`)
        );
        expect(wrapper.attributes('aria-current')).toBeUndefined();
    });
});

describe('[RACE-02] RoundCard live state', () => {
    it('marks the running round with aria-current', () => {
        const wrapper = mount(RoundCard, {
            props: { round: ROUND, horsesById: HORSES_BY_ID, state: 'live' },
        });

        expect(wrapper.attributes('aria-current')).toBe('step');
        expect(wrapper.text()).toContain('Live');
    });
});

describe('[UX-02] ThemeToggle', () => {
    it.each([
        ['dark', 'true'],
        ['light', 'false'],
    ] as const)('reports the %s theme as pressed %s and asks to toggle', async (theme, pressed) => {
        const wrapper = mount(ThemeToggle, { props: { theme } });

        await click(wrapper, 1);

        expect(wrapper.attributes('aria-pressed')).toBe(pressed);
        expect(wrapper.text()).toBe('Dark theme');
        expect(wrapper.emitted('toggle')).toHaveLength(1);
    });
});
