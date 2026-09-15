import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';

const SEED = 20260915;
const CLOCK_START = Date.parse('2026-09-15T12:00:00Z');
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    phone: { width: 390, height: 844 },
} as const;

async function openSeeded(page: Page): Promise<void> {
    await page.clock.install({ time: CLOCK_START });
    await page.goto(`/?seed=${SEED}`);
    // The installed clock keeps flowing, so pause it and let runFor alone move the race.
    await page.clock.pauseAt(CLOCK_START + 60_000);
}

async function runRace(page: Page, durationMs: number): Promise<void> {
    await page.getByRole('button', { name: 'Generate Program' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.clock.runFor(durationMs);
}

// Pausing on lap 2 freezes the horses mid-track with the lap 1 results already listed.
async function pauseOnLapTwo(page: Page): Promise<void> {
    await openSeeded(page);
    await runRace(page, 9000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
}

async function finishRace(page: Page): Promise<void> {
    // Simulating all six laps takes over half of the default timeout.
    test.slow();
    await openSeeded(page);
    await runRace(page, 60_000);
    await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Generate Program' })).toBeEnabled();
}

for (const colorScheme of ['dark', 'light'] as const) {
    test.describe(`[RACE-02] [RES-01] [UX-02] [UX-03] dashboard visual (${colorScheme})`, () => {
        test.use({ colorScheme });

        for (const [device, viewport] of Object.entries(VIEWPORTS)) {
            test(`shows a paused race on a ${device}`, async ({ page }) => {
                await page.setViewportSize(viewport);
                await pauseOnLapTwo(page);

                await expect(page).toHaveScreenshot(`dashboard-${device}-${colorScheme}.png`, {
                    fullPage: true,
                });
            });
        }

        test('shows a finished race on a desktop', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.desktop);
            await finishRace(page);
            await expect(
                page.getByRole('region', { name: 'Results' }).getByRole('table')
            ).toHaveCount(6);

            await expect(page).toHaveScreenshot(`dashboard-desktop-finished-${colorScheme}.png`, {
                fullPage: true,
            });
        });
    });
}

test.describe('[UX-01] [UX-02] [UX-03] idle dashboard visual', () => {
    test.use({ colorScheme: 'dark', viewport: VIEWPORTS.phone });

    test('shows guidance before a program exists on a phone', async ({ page }) => {
        await openSeeded(page);
        await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();

        await expect(page).toHaveScreenshot('dashboard-phone-idle-dark.png', { fullPage: true });
    });
});

test.describe('[PROG-04] [UX-02] ready dashboard visual', () => {
    test.use({ colorScheme: 'light', viewport: VIEWPORTS.desktop });

    test('lists the generated program on a desktop', async ({ page }) => {
        await openSeeded(page);
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();

        await expect(page).toHaveScreenshot('dashboard-desktop-ready-light.png', {
            fullPage: true,
        });
    });
});

test.describe('[RES-01] [RES-02] [UX-03] results tab visual', () => {
    test.use({ colorScheme: 'light', viewport: VIEWPORTS.phone });

    test('shows every lap result in the Results tab on a phone', async ({ page }) => {
        await finishRace(page);
        await page.getByRole('tab', { name: 'Results' }).click();
        await expect(
            page.getByRole('tabpanel', { name: 'Results' }).getByRole('table')
        ).toHaveCount(6);

        await expect(page).toHaveScreenshot('dashboard-phone-results-light.png', {
            fullPage: true,
        });
    });
});
