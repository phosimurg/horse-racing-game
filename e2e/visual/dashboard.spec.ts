import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';

const SEED = 20260915;
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    phone: { width: 390, height: 844 },
} as const;

// Pausing on lap 2 freezes the horses mid-track with the lap 1 results already listed.
async function pauseOnLapTwo(page: Page): Promise<void> {
    await page.clock.install();
    await page.goto(`/?seed=${SEED}`);
    await page.getByRole('button', { name: 'Generate Program' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.clock.runFor(9000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
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
    });
}
