import { setTimeout as delay } from 'node:timers/promises';

import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

const SEED = 20260915;
const LAP_TITLES = [
    '1ST Lap - 1200m',
    '2ND Lap - 1400m',
    '3RD Lap - 1600m',
    '4TH Lap - 1800m',
    '5TH Lap - 2000m',
    '6TH Lap - 2200m',
];

async function openSeeded(page: Page): Promise<void> {
    await page.clock.install();
    await page.goto(`/?seed=${SEED}`);
}

async function progressValues(page: Page): Promise<string[]> {
    return page
        .locator('#race-track svg')
        .evaluateAll((runners) =>
            runners.map((runner) => getComputedStyle(runner).getPropertyValue('--progress'))
        );
}

test.describe('[PROG-01] [PROG-02] [PROG-03] [CTRL-01] program generation', () => {
    test('lists six laps with their distances and ten lanes each @smoke', async ({ page }) => {
        await openSeeded(page);
        await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();

        await page.getByRole('button', { name: 'Generate Program' }).click();

        const program = page.getByRole('region', { name: 'Program' });
        await expect(program.getByRole('heading', { level: 3 })).toHaveText(LAP_TITLES);
        await expect(program.getByRole('table').first().locator('tbody tr')).toHaveCount(10);
        await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();
    });
});

test.describe('[RACE-01] [RACE-02] [RES-01] [RES-02] [CTRL-02] full race', () => {
    test('runs every lap in order, publishes results and finishes @smoke', async ({ page }) => {
        // Simulating a whole race takes close to the default timeout in WebKit.
        test.slow();
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();

        await page.getByRole('button', { name: 'Start' }).click();
        await page.clock.runFor(1000);

        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Program' })).toBeDisabled();
        await expect(page.locator('#race-track')).toContainText('LAP 1/6 - 1200 M');
        await expect(
            page.getByRole('list', { name: 'Laps', exact: true }).locator('[aria-current="step"]')
        ).toContainText('Lap 1');

        await page.clock.runFor(60_000);

        const results = page.getByRole('region', { name: 'Results' });
        await expect(results.getByRole('table')).toHaveCount(6);
        await expect(results.locator('caption')).toHaveText(LAP_TITLES);
        await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Generate Program' })).toBeEnabled();
        expect(new Set(await progressValues(page))).toEqual(new Set(['1']));
    });
});

test.describe('[RACE-03] pause and resume', () => {
    test('freezes the horses while paused and continues after resuming', async ({ page }) => {
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        await page.clock.runFor(1500);

        await page.getByRole('button', { name: 'Pause' }).click();
        const frozen = await progressValues(page);
        await page.clock.runFor(5000);

        expect(await progressValues(page)).toEqual(frozen);

        await page.getByRole('button', { name: 'Resume' }).click();
        await page.clock.runFor(1000);

        expect(await progressValues(page)).not.toEqual(frozen);
    });
});

test.describe('[CTRL-02] repeated activation', () => {
    test('treats a double click on Start as a single activation', async ({ page }) => {
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();

        await page.getByRole('button', { name: 'Start' }).dblclick();

        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    });
});

test.describe('[NFR-03] seeded replays', () => {
    test('draws the same roster for the same seed', async ({ page }) => {
        await openSeeded(page);
        const roster = page.getByRole('region', { name: 'Horse List' }).locator('tbody tr');
        const first = await roster.allTextContents();

        await page.reload();

        await expect(roster).toHaveText(first);
    });
});

test.describe('[RACE-05] viewport changes during a round', () => {
    test('finishes the race after the viewport is resized mid-round', async ({ page }) => {
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        await page.clock.runFor(1500);

        await page.setViewportSize({ width: 390, height: 844 });
        await page.clock.runFor(60_000);
        await page.getByRole('tab', { name: 'Results' }).click();

        await expect(
            page.getByRole('tabpanel', { name: 'Results' }).getByRole('table')
        ).toHaveCount(6);
    });
});

// Distance between each runner's rendered position and the position its progress calls for.
async function runnerOffsets(page: Page): Promise<number[]> {
    return page.locator('#race-track svg').evaluateAll((runners) =>
        runners.map((runner) => {
            const strip = (runner.parentElement ?? runner).getBoundingClientRect();
            const box = runner.getBoundingClientRect();
            const progress = Number(getComputedStyle(runner).getPropertyValue('--progress'));
            return box.left - strip.left - progress * (strip.width - box.width);
        })
    );
}

test.describe('[RACE-02] horse positions', () => {
    test('keeps every galloping horse where its progress places it', async ({ page }) => {
        const clockStart = Date.parse('2026-09-15T12:00:00Z');
        await page.clock.install({ time: clockStart });
        await page.goto(`/?seed=${SEED}`);
        // A paused clock freezes progress while the CSS gallop keeps running in real time.
        await page.clock.pauseAt(clockStart + 60_000);
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        await page.clock.runFor(2000);

        const offsets: number[] = [];
        for (let sample = 0; sample < 6; sample += 1) {
            offsets.push(...(await runnerOffsets(page)));
            await delay(60);
        }

        expect(offsets).toHaveLength(60);
        expect(Math.max(...offsets.map((offset) => Math.abs(offset)))).toBeLessThanOrEqual(1);
    });
});

test.describe('[RES-01] results scrolling', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('shows the newest lap inside the Results panel without scrolling the page', async ({
        page,
    }) => {
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();

        const list = page.getByRole('list', { name: 'Results by lap' });
        // Each poll advances the race by half a second until the third lap has finished.
        await expect
            .poll(
                async () => {
                    await page.clock.runFor(500);
                    return list.getByRole('table').count();
                },
                { intervals: [50], timeout: 30_000 }
            )
            .toBe(3);

        await expect
            .poll(() =>
                list.evaluate((element) => {
                    const newest = element.lastElementChild?.getBoundingClientRect();
                    const box = element.getBoundingClientRect();
                    return (
                        newest !== undefined &&
                        newest.top >= box.top - 1 &&
                        newest.bottom <= box.bottom + 1
                    );
                })
            )
            .toBe(true);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
});
