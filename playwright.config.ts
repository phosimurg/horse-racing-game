import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    // Baselines are written only by an explicit --update-snapshots run in Docker.
    updateSnapshots: 'none',
    workers: isCI ? 2 : undefined,
    reporter: isCI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    expect: {
        toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 },
    },
    projects: [
        {
            name: 'e2e-chromium',
            testIgnore: '**/visual/**',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'e2e-firefox',
            testIgnore: '**/visual/**',
            grep: /@smoke/,
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'e2e-webkit',
            testIgnore: '**/visual/**',
            grep: /@smoke/,
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'visual',
            testMatch: '**/visual/**/*.spec.ts',
            // A retry would hide a screenshot that differs between runs.
            retries: 0,
            use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
        },
    ],
    webServer: {
        command: `npm run build-only && npm run preview -- --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !isCI,
        timeout: 120_000,
    },
});
