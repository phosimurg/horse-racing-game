import { expect, expectNoAccessibilityViolations, test } from './fixtures';

test.describe('App shell', () => {
    test('shows the application title @smoke', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { level: 1, name: 'Horse Racing' })).toBeVisible();
    });

    test('has no detectable WCAG violations', async ({ page }) => {
        await page.goto('/');

        await expectNoAccessibilityViolations(page);
    });
});
