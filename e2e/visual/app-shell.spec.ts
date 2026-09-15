import { expect, test } from '../fixtures';

test.describe('App shell visual', () => {
    test('matches the baseline', async ({ page }) => {
        // A fixed seed keeps the roster, and so the screenshot, deterministic.
        await page.goto('/?seed=1');

        await expect(page).toHaveScreenshot('app-shell.png', { fullPage: true });
    });
});
