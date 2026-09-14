const SCOPES = [
    'domain',
    'stores',
    'playback',
    'ui',
    'a11y',
    'e2e',
    'visual',
    'ci',
    'docs',
    'ai',
    'deps',
    'config',
];

export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'header-max-length': [2, 'always', 72],
        'body-max-line-length': [2, 'always', 72],
        'footer-max-line-length': [2, 'always', 72],
        'scope-enum': [2, 'always', SCOPES],
    },
};
