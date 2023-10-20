const jsonRules = {
    'indent': [
        'error',
        4,
        {
            SwitchCase: 1,
            ignoredNodes: ['VariableDeclaration[declarations.length=0]']
        }
    ],
    '@typescript-eslint/consistent-type-assertions': 'off'
};

const javascriptRules = {
    ...jsonRules,
    'react/style-prop-object': 'off',
    'quotes': ['error', 'single'],
    'quote-props': ['error', 'consistent-as-needed'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'no-extra-semi': 'error',
    'no-unused-vars': [
        'error',
        { args: 'after-used', varsIgnorePattern: '^__unused' }
    ],
    'semi': ['error', 'always']
};

const typescriptRules = {
    ...javascriptRules,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', varsIgnorePattern: '^__unused' }
    ]
};

module.exports = {
    root: true,
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
            './tsconfig.eslint.json'
        ],
        EXPERIMENTAL_useProjectService: true
    },
    ignorePatterns: [
        '**/*',
        '!**/*.json',
        '!**/*.js',
        '!**/*.mjs',
        '!**/*.ts',
        'dist/**',
        'tmp/**',
        'tools/**/_msr*',
        'node_modules/**'
    ],
    plugins: ['@nx'],
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            extends: ['plugin:@nx/typescript'],
            rules: typescriptRules
        },
        {
            files: ['*.js', '*.jsx'],
            extends: ['plugin:@nx/javascript'],
            rules: javascriptRules
        },
        {
            files: ['*.mjs'],
            extends: ['plugin:@nx/javascript'],
            rules: javascriptRules,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2021
            }
        },
        {
            files: ['*.json'],
            parser: 'jsonc-eslint-parser',
            extends: ['plugin:jsonc/recommended-with-json'],
            rules: jsonRules
        }
    ]
};
