import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, type Pinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { ANNOUNCE_DELAY_MS } from '@/composables/useAnnouncer';
import { RNG_KEY } from '@/composables/useRng';
import { createRng } from '@/domain';
import { useHorsesStore } from '@/stores/horses';
import { useRaceStore } from '@/stores/race';
import { stubAnimationFrames } from '@/test/animationFrames';
import { stubMatchMedia } from '@/test/matchMedia';

import RaceDashboardView from './RaceDashboardView.vue';

Element.prototype.scrollIntoView = vi.fn<() => void>();

let wrapper: VueWrapper | undefined;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
});

function mountView({ narrow = false } = {}) {
    stubMatchMedia(narrow);
    const frames = stubAnimationFrames();
    const pinia: Pinia = createPinia();
    wrapper = mount(RaceDashboardView, {
        global: { plugins: [pinia], provide: { [RNG_KEY]: createRng(42) } },
        attachTo: document.body,
    });
    return { view: wrapper, frames, race: useRaceStore(pinia), horses: useHorsesStore(pinia) };
}

function button(view: VueWrapper, name: string) {
    const found = view.findAll('button').find((candidate) => candidate.text() === name);
    if (!found) {
        throw new Error(`No button named ${name}`);
    }
    return found;
}

async function activate(view: VueWrapper, name: string): Promise<void> {
    button(view, name).element.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
    await nextTick();
}

async function announcement(view: VueWrapper): Promise<string> {
    vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    await nextTick();
    return view.get('[role="status"]').text();
}

function isDisabled(view: VueWrapper, name: string): boolean {
    return (button(view, name).element as HTMLButtonElement).disabled;
}

describe('[UX-01] dashboard before a program exists', () => {
    it('shows guidance on the track, the program and the results', () => {
        const { view } = mountView();

        expect(view.get('#race-track').text()).toContain('Generate a program');
        expect(view.get('.program-panel').text()).toContain('Generate a program');
        expect(view.get('.results-panel').text()).toContain('Generate a program');
    });
});

describe('[HORSE-04] dashboard roster', () => {
    it('lists the 20 horses drawn at load with name, condition and color', () => {
        const { view, horses } = mountView();
        const rows = view.findAll('.horse-roster tbody tr');

        expect(rows).toHaveLength(20);
        expect(rows[0]?.text()).toContain(horses.horses[0]?.name);
        expect(rows[0]?.text()).toContain(horses.horses[0]?.color.name);
        expect(view.findAll('.horse-roster meter')).toHaveLength(20);
    });
});

describe('[CTRL-01] dashboard race control', () => {
    it('disables the race control until a program exists', () => {
        const { view } = mountView();

        expect(isDisabled(view, 'Start')).toBe(true);
        expect(isDisabled(view, 'Generate Program')).toBe(false);
    });
});

describe('[PROG-04] dashboard program generation', () => {
    it('lists six racecards, enables Start and announces the program', async () => {
        const { view } = mountView();

        await activate(view, 'Generate Program');

        expect(view.findAll('.program-panel .round-card')).toHaveLength(6);
        expect(view.get('.program-panel').text()).toContain('1ST Lap - 1200m');
        expect(view.get('.program-panel').text()).toContain('6TH Lap - 2200m');
        expect(isDisabled(view, 'Start')).toBe(false);
        expect(await announcement(view)).toBe(
            'New program ready: 20 new horses, 6 laps from 1200 to 2200 meters.'
        );
    });
});

describe('[RACE-01] dashboard race start', () => {
    it('starts the race, moves the horses and disables Generate Program', async () => {
        const { view, frames } = mountView();
        await activate(view, 'Generate Program');
        await announcement(view);

        await activate(view, 'Start');
        frames.frame(0);
        frames.frame(100);
        frames.frame(200);
        await nextTick();

        const progress = view
            .findAll('.race-lane-runner')
            .map((runner) =>
                Number(/--progress:\s*([\d.]+)/.exec(runner.attributes('style') ?? '')?.[1])
            );
        expect(progress).toHaveLength(10);
        expect(progress.every((value) => value > 0)).toBe(true);
        expect(isDisabled(view, 'Generate Program')).toBe(true);
        expect(view.get('[aria-current="step"]').text()).toContain('Lap 1');
        expect(await announcement(view)).toBe('Race started. Lap 1, 1200 meters.');
    });
});

describe('[RACE-03] dashboard pause', () => {
    it('reads Resume while paused and announces the pause', async () => {
        const { view } = mountView();
        await activate(view, 'Generate Program');
        await announcement(view);
        await activate(view, 'Start');
        await announcement(view);

        await activate(view, 'Pause');

        expect(button(view, 'Resume').exists()).toBe(true);
        expect(await announcement(view)).toBe('Race paused.');
    });
});

describe('[RES-01] dashboard results', () => {
    it('shows the first lap results with podium markers and announces the winner', async () => {
        const { view, frames, race, horses } = mountView();
        await activate(view, 'Generate Program');
        await activate(view, 'Start');

        for (let frame = 0; frame < 200 && race.results.length === 0; frame += 1) {
            frames.frame(frame * 100);
        }
        await nextTick();

        const winner = horses.horsesById.get(race.results[0]?.placements[0]?.horseId ?? -1);
        const table = view.get('.results-panel table');
        expect(table.get('caption').text()).toBe('1ST Lap - 1200m');
        expect(table.findAll('tbody tr')).toHaveLength(10);
        expect(
            table.findAll('.tone-gold, .tone-silver, .tone-bronze').map((badge) => badge.text())
        ).toEqual(['1st', '2nd', '3rd']);
        expect(await announcement(view)).toContain(`Lap 1 finished. Winner: ${winner?.name}.`);
    });
});

describe('[UX-03] dashboard narrow layout', () => {
    it('shows Horses, Program and Results as tabs and keeps the controls in the action bar', () => {
        const { view } = mountView({ narrow: true });

        expect(view.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
            'Horses',
            'Program',
            'Results',
        ]);
        expect(view.get('.mobile-action-bar').text()).toContain('Generate Program');
        expect(view.get('.mobile-action-bar').text()).toContain('Start');
    });
});

describe('[UX-02] dashboard theme', () => {
    it('switches the document theme from the toggle', async () => {
        mountView();
        const before = document.documentElement.dataset.theme;

        await activate(wrapper as VueWrapper, 'Dark theme');

        expect(document.documentElement.dataset.theme).not.toBe(before);
    });
});
