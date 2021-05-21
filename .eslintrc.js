module.exports = {
    root: true,
    env: {
        node: true,
        es6: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended'
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
                allowExpressions: true
            }
        ],
        'object-shorthand': ['error', 'always', { avoidQuotes: true }]
    },
    parserOptions: {
        parser: '@typescript-eslint/parser'
    }
};
