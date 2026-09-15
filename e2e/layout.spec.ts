import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

// Content that escapes a scroll area stretches the page; the 1 px live region below the body is expected.
function emptySpaceBelowContent(page: Page): Promise<number> {
    return page.evaluate(
        () =>
            document.documentElement.scrollHeight -
            Math.ceil(document.body.getBoundingClientRect().height)
    );
}

test.describe('[UX-03] narrow layout', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('shows the panels as tabs and keeps the controls in the bottom bar', async ({ page }) => {
        await page.goto('/?seed=1');

        await expect(page.getByRole('tab')).toHaveText(['Horses', 'Program', 'Results']);
        await page.getByRole('tab', { name: 'Program' }).click();

        await expect(page.getByRole('tabpanel', { name: 'Program' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Program' })).toBeInViewport();
    });

    test('ends the page with its content when the Program tab lists every lap', async ({
        page,
    }) => {
        await page.goto('/?seed=1');
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('tab', { name: 'Program' }).click();
        await expect(page.getByRole('list', { name: 'Program laps' })).toBeVisible();

        expect(await emptySpaceBelowContent(page)).toBeLessThanOrEqual(1);
    });

    test('keeps the scroll padding clear of the bottom bar when its buttons wrap', async ({
        page,
    }) => {
        await page.goto('/?seed=1');
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        await page.getByRole('button', { name: 'Pause' }).click();
        await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

        const space = await page.evaluate(() => ({
            padding: Number.parseFloat(
                getComputedStyle(document.documentElement).scrollPaddingBlockEnd
            ),
            bar:
                document.querySelector('.mobile-action-bar')?.getBoundingClientRect().height ??
                Number.POSITIVE_INFINITY,
        }));

        expect(space.padding).toBeGreaterThanOrEqual(space.bar);
    });
});

test.describe('Wide layout', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('ends the page with its content when the program lists every lap', async ({ page }) => {
        await page.goto('/?seed=1');
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await expect(page.getByRole('list', { name: 'Program laps' })).toBeVisible();

        expect(await emptySpaceBelowContent(page)).toBeLessThanOrEqual(1);
    });
});

test.describe('[NFR-02] reflow and targets', () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test('has no horizontal scrolling at 320 CSS pixels', async ({ page }) => {
        await page.goto('/?seed=1');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );

        expect(overflow).toBeLessThanOrEqual(0);
    });

    test('gives the primary controls targets of at least 44 by 44 pixels', async ({ page }) => {
        await page.goto('/?seed=1');

        const boxes = await Promise.all(
            ['Generate Program', 'Start'].map((name) =>
                page.getByRole('button', { name }).boundingBox()
            )
        );

        expect(boxes.map((box) => Math.min(box?.width ?? 0, box?.height ?? 0) >= 44)).toEqual([
            true,
            true,
        ]);
    });
});

test.describe('Tablet layout', () => {
    for (const viewport of [
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
    ]) {
        test(`shows all six laps in the lap stepper at ${viewport.width} pixels`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport);
            await page.goto('/?seed=1');
            await page.getByRole('button', { name: 'Generate Program' }).click();

            const laps = page
                .getByRole('list', { name: 'Laps', exact: true })
                .getByRole('listitem');
            await expect(laps).toHaveCount(6);
            for (const lap of await laps.all()) {
                await expect(lap).toBeInViewport({ ratio: 1 });
            }
        });
    }
});
