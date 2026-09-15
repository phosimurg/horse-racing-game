import { expect, test } from './fixtures';

test.describe('[UX-03] narrow layout', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('shows the panels as tabs and keeps the controls in the bottom bar', async ({ page }) => {
        await page.goto('/?seed=1');

        await expect(page.getByRole('tab')).toHaveText(['Horses', 'Program', 'Results']);
        await page.getByRole('tab', { name: 'Program' }).click();

        await expect(page.getByRole('tabpanel', { name: 'Program' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Program' })).toBeInViewport();
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
