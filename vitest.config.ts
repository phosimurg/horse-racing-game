import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: 'jsdom',
            root: fileURLToPath(new URL('./', import.meta.url)),
            include: ['src/**/*.spec.ts'],
            exclude: [...configDefaults.exclude, 'e2e/**'],
            setupFiles: ['src/test/setup.ts'],
            restoreMocks: true,
            coverage: {
                provider: 'v8',
                include: ['src/**/*.{ts,vue}'],
                exclude: ['src/**/*.spec.ts', 'src/test/**', 'src/main.ts', 'src/**/*.types.ts'],
                reporter: ['text', 'html', 'lcov'],
                thresholds: {
                    lines: 90,
                    functions: 90,
                    statements: 90,
                    branches: 85,
                    'src/domain/**': { 100: true },
                },
            },
        },
    })
);
