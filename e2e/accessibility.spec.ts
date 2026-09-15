import { expect, expectNoAccessibilityViolations, test } from './fixtures';

for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`[NFR-01] accessibility in the ${colorScheme} theme`, () => {
        test.use({ colorScheme });

        test('reports no axe violations before and during a race', async ({ page }) => {
            await page.clock.install();
            await page.goto('/?seed=7');
            await expectNoAccessibilityViolations(page);

            await page.getByRole('button', { name: 'Generate Program' }).click();
            await page.getByRole('button', { name: 'Start' }).click();
            await page.clock.runFor(2000);

            await expectNoAccessibilityViolations(page);
        });

        test('reports no axe violations on a phone', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto('/?seed=7');
            await page.getByRole('button', { name: 'Generate Program' }).click();

            await expectNoAccessibilityViolations(page);
        });
    });
}

test.describe('[UX-02] theme preference', () => {
    test('follows the system scheme, then restores the chosen theme after a reload', async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

        await page.getByRole('button', { name: 'Dark theme' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
    });
});

test.describe('[NFR-01] keyboard access', () => {
    test('moves focus to the race track through the skip link', async ({ page }) => {
        await page.goto('/');

        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Skip to the race track' })).toBeFocused();
        await page.keyboard.press('Enter');

        await expect(page.locator('#race-track')).toBeFocused();
    });
});

test.describe('[NFR-01] selected tab', () => {
    test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });

    test('marks the selected tab with an underline and a forced-colors highlight', async ({
        page,
    }) => {
        await page.goto('/?seed=7');

        await expect(page.getByRole('tab', { selected: true })).toHaveCSS(
            'text-decoration-line',
            'underline'
        );
        await expect(page.getByRole('tab', { selected: false }).first()).toHaveCSS(
            'text-decoration-line',
            'none'
        );

        await page.emulateMedia({ forcedColors: 'active' });
        const backgrounds = await page.getByRole('tablist').evaluate((list) => ({
            list: getComputedStyle(list).backgroundColor,
            selected: getComputedStyle(list.querySelector('[aria-selected="true"]') ?? list)
                .backgroundColor,
        }));
        expect(backgrounds.selected).not.toBe(backgrounds.list);
    });
});

test.describe('[NFR-01] reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('moves the horses without running any animation', async ({ page }) => {
        await page.clock.install();
        await page.goto('/?seed=7');
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        await page.clock.runFor(1000);

        const state = await page.evaluate(() => ({
            progress: Number(
                getComputedStyle(
                    document.querySelector('#race-track svg') ?? document.body
                ).getPropertyValue('--progress')
            ),
            running: document
                .getAnimations()
                .filter((animation) => animation.playState === 'running').length,
        }));

        expect(state.progress).toBeGreaterThan(0);
        expect(state.running).toBe(0);
    });
});
