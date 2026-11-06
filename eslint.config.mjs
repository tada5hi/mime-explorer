import config from '@tada5hi/eslint-config';

export default config(
    { typescript: true },
    { ignores: ['**/dist/**', '**/*.d.ts', '**/coverage/**'] },
    { rules: {
        "class-methods-use-this": "off",
        "no-continue": "off",
        "no-use-before-define": "off",
        "no-useless-escape": "off",
        "no-nested-ternary": "off",
        "@typescript-eslint/no-unused-vars": "off"
    } },
);
