// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
    packageManager: 'npm',
    testRunner: 'vitest',
    // Leave vitest.dir unset: the include globs would resolve against it and find no specs.
    vitest: { configFile: 'vitest.config.ts' },
    mutate: [
        'src/domain/**/*.ts',
        '!src/domain/**/*.spec.ts',
        '!src/domain/**/*.types.ts',
        '!src/domain/index.ts',
    ],
    reporters: ['clear-text', 'progress', 'html', 'json'],
    htmlReporter: { fileName: 'reports/mutation/index.html' },
    thresholds: { high: 90, low: 80, break: 80 },
    tempDirName: '.stryker-tmp',
};
