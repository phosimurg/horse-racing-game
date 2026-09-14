import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export const test = base.extend<{ pageErrors: string[] }>({
    pageErrors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('console', (message) => {
                if (message.type() === 'error') {
                    errors.push(message.text());
                }
            });
            await use(errors);
            expect(errors, 'uncaught page errors or console errors').toEqual([]);
        },
        { auto: true },
    ],
});

export async function expectNoAccessibilityViolations(page: Page): Promise<void> {
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(violations).toEqual([]);
}

export { expect };
