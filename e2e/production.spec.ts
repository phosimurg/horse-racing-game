import { expect, test } from './fixtures';

test.describe('[NFR-06] production security', () => {
    test('ships a Content Security Policy and makes no third-party requests @smoke', async ({
        page,
    }) => {
        const origins = new Set<string>();
        page.on('request', (request) => origins.add(new URL(request.url()).origin));

        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
            'content',
            /default-src 'self'/
        );
        expect([...origins]).toEqual([new URL(page.url()).origin]);
    });
});

test.describe('[NFR-06] production metadata', () => {
    test('declares the SVG icon and a theme color for each color scheme', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
        await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    });
});

test.describe('[NFR-04] runtime quality', () => {
    test('moves the horses with transforms only', async ({ page }) => {
        await page.clock.install();
        await page.goto('/?seed=3');
        await page.getByRole('button', { name: 'Generate Program' }).click();
        await page.getByRole('button', { name: 'Start' }).click();
        const runner = page.locator('#race-track svg').first();
        const placement = () =>
            runner.evaluate((element) => ({
                x: element.getBoundingClientRect().x,
                left: getComputedStyle(element).left,
            }));

        await page.clock.runFor(500);
        const early = await placement();
        await page.clock.runFor(1000);
        const later = await placement();

        expect(later.x).toBeGreaterThan(early.x);
        expect([early.left, later.left]).toEqual(['0px', '0px']);
    });
});

test.describe('[NFR-05] performance budget', () => {
    test('keeps the scripts and styles of the first load under 250 kB', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const bytes = await page.evaluate(() =>
            performance
                .getEntriesByType('resource')
                .filter((entry) => /\.(js|css)$/.test(new URL(entry.name).pathname))
                .reduce(
                    (total, entry) => total + (entry as PerformanceResourceTiming).decodedBodySize,
                    0
                )
        );

        expect(bytes).toBeGreaterThan(0);
        expect(bytes).toBeLessThan(250_000);
    });
});
