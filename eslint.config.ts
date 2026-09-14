import pluginVitest from '@vitest/eslint-plugin';
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript';
import { globalIgnores } from 'eslint/config';
import skipFormatting from 'eslint-config-prettier/flat';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import pluginVue from 'eslint-plugin-vue';

// Matches alias (`@/stores/...`) and relative (`../stores/...`) imports of the given layers.
function layerImport(layers: string[], message: string) {
    return { regex: `^(@|\\.{1,2})/(.*/)?(${layers.join('|')})(/|$)`, message };
}

// esquery regexes cannot contain a literal slash, so \u002F stands for it.
const TEST_HELPER_IMPORT = String.raw`^(@|\.{1,2})\u002F(.*\u002F)?test(\u002F|$)`;

const DOM_GLOBALS = [
    'window',
    'document',
    'navigator',
    'localStorage',
    'sessionStorage',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'performance',
];

export default withVueTs(
    { name: 'app/files-to-lint', files: ['**/*.{vue,ts,mts,tsx}'] },

    globalIgnores([
        '**/dist/**',
        '**/coverage/**',
        'playwright-report/**',
        'test-results/**',
        'reports/**',
        '.stryker-tmp/**',
    ]),

    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommendedTypeChecked,

    {
        name: 'app/conventions',
        files: ['**/*.{vue,ts,mts,tsx}'],
        plugins: { sonarjs: pluginSonarjs },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'sonarjs/cognitive-complexity': ['error', 10],
            'vue/block-order': ['error', { order: ['script[setup]', 'template', 'style[scoped]'] }],
            'vue/component-api-style': ['error', ['script-setup']],
            'vue/component-name-in-template-casing': [
                'error',
                'PascalCase',
                { registeredComponentsOnly: false },
            ],
            'vue/define-macros-order': [
                'error',
                { order: ['defineProps', 'defineEmits', 'defineModel'] },
            ],
            'vue/no-unused-components': 'error',
            'vue/no-unused-refs': 'error',
        },
    },

    {
        name: 'app/boundaries/domain',
        files: ['src/domain/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: '^(vue|pinia)$|^@vue/',
                            message: 'The domain layer is framework-free.',
                        },
                        layerImport(
                            ['stores', 'composables', 'components', 'views', 'utils'],
                            'The domain layer must not import application layers.'
                        ),
                    ],
                },
            ],
            'no-restricted-globals': ['error', ...DOM_GLOBALS],
        },
    },

    {
        name: 'app/boundaries/stores',
        files: ['src/stores/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        layerImport(
                            ['components', 'views'],
                            'Stores must not import components or views.'
                        ),
                        {
                            regex: '^(@|\\.{1,2})/(.*/)?composables/(?!useRng$)',
                            message: 'Stores may only use the useRng composable.',
                        },
                    ],
                },
            ],
        },
    },

    {
        name: 'app/boundaries/components',
        files: ['src/components/common/**/*.{ts,vue}', 'src/views/*/components/**/*.{ts,vue}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        layerImport(
                            ['stores', 'composables'],
                            'Only view components may use stores and composables.'
                        ),
                    ],
                },
            ],
        },
    },

    {
        name: 'app/boundaries/ui-kit',
        files: ['src/components/ui/**/*.{ts,vue}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        layerImport(
                            ['stores', 'composables', 'domain'],
                            'UI kit components must stay business-agnostic.'
                        ),
                    ],
                },
            ],
        },
    },

    {
        name: 'app/boundaries/test-helpers',
        files: ['src/**/*.{ts,vue}'],
        ignores: ['src/**/*.spec.ts', 'src/test/**'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: `ImportDeclaration[source.value=/${TEST_HELPER_IMPORT}/]`,
                    message: 'Only spec files may import test helpers.',
                },
            ],
        },
    },

    { ...pluginVitest.configs.recommended, files: ['src/**/*.spec.ts'] },
    {
        ...pluginPlaywright.configs['flat/recommended'],
        files: ['e2e/**/*.ts'],
        rules: {
            ...pluginPlaywright.configs['flat/recommended'].rules,
            'playwright/expect-expect': [
                'error',
                { assertFunctionNames: ['expectNoAccessibilityViolations'] },
            ],
        },
    },

    ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

    skipFormatting
);
