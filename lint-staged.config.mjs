export default {
    '*.vue': [
        'oxlint --fix',
        'eslint --fix --max-warnings=0',
        'stylelint --fix',
        'prettier --write',
    ],
    '*.{ts,mts}': ['oxlint --fix', 'eslint --fix --max-warnings=0', 'prettier --write'],
    '*.css': ['stylelint --fix', 'prettier --write'],
    '*.{js,mjs,json,md,yml,yaml,html}': ['prettier --write'],
};
