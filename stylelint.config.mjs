export default {
    // stylelint-config-recommended-vue sets the Vue custom syntax and must stay last.
    extends: [
        'stylelint-config-standard',
        'stylelint-config-recess-order',
        'stylelint-config-recommended-vue',
    ],
    rules: {
        'declaration-no-important': true,
    },
};
