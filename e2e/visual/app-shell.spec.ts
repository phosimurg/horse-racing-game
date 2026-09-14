import { expect, test } from '../fixtures';

test.describe('App shell visual', () => {
    test('matches the baseline', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveScreenshot('app-shell.png', { fullPage: true });
    });
});
