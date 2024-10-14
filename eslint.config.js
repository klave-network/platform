import nxPlugin from '@nx/eslint-plugin';
import { readCachedProjectGraph } from '@nx/devkit';
import jsonParser from 'jsonc-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import stylisticTsPlugin from '@stylistic/eslint-plugin-ts';
import importPlugin from 'eslint-plugin-import';
import path from 'node:path';
import * as glob from 'glob';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupPluginRules } from '@eslint/compat';

const projectGraph = readCachedProjectGraph();
const projectsFolders = Object.keys(projectGraph.nodes).map(key => projectGraph.nodes[key].data.root);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonRules = {
    '@stylistic/indent': [
        'error',
        4,
        {
            SwitchCase: 1,
            ignoredNodes: ['VariableDeclaration[declarations.length=0]']
        }
    ],
    '@stylistic/consistent-type-assertions': 'off'
};

const javascriptRules = {
    ...jsonRules,
    '@/no-trailing-spaces': 'error',
    '@/no-unused-vars': [
        'error',
        { args: 'after-used', varsIgnorePattern: '^__unused' }
    ],
    '@nx/enforce-module-boundaries': [
        'error',
        {
            enforceBuildableLibDependency: true,
            allow: [],
            depConstraints: [
                {
                    sourceTag: '*',
                    onlyDependOnLibsWithTags: ['*']
                }
            ]
        }
    ],
    'react/style-prop-object': 'off',
    '@stylistic/quotes': ['error', 'single'],
    '@stylistic/quote-props': ['error', 'consistent-as-needed'],
    '@stylistic/comma-dangle': ['error', 'never'],
    '@stylistic/no-extra-semi': 'error',
    '@stylistic/semi': ['error', 'always']
};

const typescriptRules = {
    ...javascriptRules,
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/promise-function-async': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn'
};

const base = [
    {
        name: 'ignore',
        ignores: [
            '.nx/',
            '.husky/',
            '.verdaccio/',
            'dist/',
            'tmp/',
            'tools/**/_msr*',
            '**/assembly/**/*.ts',
            '**/.expo',
            '**/node_modules/**',
            '**/template/',
            '**/vendor/',
            '**/web-build/'
        ]
    },
    {
        name: 'base',
        plugins: {
            '@nx': nxPlugin,
            '@stylistic': stylisticTsPlugin,
            '@typescript-eslint': typescriptEslintPlugin
        },

        languageOptions: {

            globals: {
                __DEBUG_BUILD__: 'readonly',
                __SENTRY_DEBUG__: 'readonly'
            },

            ecmaVersion: 'latest',
            sourceType: 'module'
        }
    }
];

projectsFolders.push('.');

for (const folder of projectsFolders) {

    const compatBase = new FlatCompat({
        baseDirectory: `${__dirname}/${folder}`,
        recommendedConfig: js.configs.recommended,
        allConfig: js.configs.all
    });

    const compat = {
        extends: (name) => {
            const legacyRules = compatBase.extends(name);
            return legacyRules;
        }
    };

    const rootFolder = folder === '.' ? '' : `${folder}/**/`;
    const projectConfig = [
        ...compat.extends('plugin:@nx/typescript').map(config => ({
            ...config,
            name: `${folder}:typescript:nx`,
            files: [`${rootFolder}*.ts`, `${rootFolder}*.tsx`]
        })),
        {
            name: `${folder}:typescript`,
            files: [`${rootFolder}*.ts`, `${rootFolder}*.tsx`],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    projectService: true,
                    warnOnUnsupportedTypeScriptVersion: false,
                    tsconfigRootDir: folder,
                    project: [`${rootFolder}tsconfig.*.json`]
                }
            },
            rules: typescriptRules
        },

        ...compat.extends('plugin:@nx/javascript').map(config => ({
            ...config,
            name: `${folder}:javascript:nx`,
            files: [`${rootFolder}*.js`, `${rootFolder}*.mjs`, `${rootFolder}*.jsx`]
        })),
        {
            name: `${folder}:javascript`,
            files: [`${rootFolder}*.js`, `${rootFolder}*.mjs`, `${rootFolder}*.jsx`],
            rules: javascriptRules
        },

        ...compat.extends('plugin:@nx/javascript').map(config => ({
            ...config,
            name: `${folder}:cjavascript:nx`,
            files: [`${rootFolder}*.cjs`]
        })),
        {
            name: `${folder}:cjavascript`,
            files: [`${rootFolder}*.cjs`],
            languageOptions: {
                parserOptions: {
                    sourceType: 'commonjs'
                }
            },
            rules: {
                ...javascriptRules,
                '@typescript-eslint/no-require-imports': 'off',
                '@stylistic/no-require-imports': 'off'
            }
        },

        ...compat.extends('plugin:@nx/react')
            .filter(config => config.plugins === undefined)
            .map(config => {

                // TODO - Remove this once import plugin is compatible with eslint 9
                if (config.plugins?.['import'])
                    config.plugins['import'] = fixupPluginRules(importPlugin);

                return {
                    ...config,
                    name: `${folder}:react:nx`,
                    files: [`${rootFolder}*.jxs`, `${rootFolder}*.tsx`]
                };
            }),

        ...compat.extends('plugin:jsonc/recommended-with-json').map(config => ({
            ...config,
            name: `${folder}:json:jsonc`,
            files: [`${rootFolder}*.json`]
        })),
        {
            name: `${folder}:json`,
            files: [`${rootFolder}*.json`],
            languageOptions: {
                parser: jsonParser
            },
            rules: {
                ...jsonRules,
                '@nx/dependency-checks': folder !== '.' ? ['error', {
                    ignoredDependencies: [
                        '@nx/*',
                        '@total-typescript/ts-reset',
                        'git-rev-sync'
                    ]
                }] : 'off'
            }
        },

        {
            files: ['**/eslint.config.js'],
            rules: {
                '@nx/enforce-module-boundaries': 'off'
            }
        },

        {
            files: ['**/bin/create-*.js'],
            rules: {
                '@typescript-eslint/no-require-imports': 'off'
            }
        }

    ];

    if (glob.globSync(`${path.join(__dirname, folder, 'cypress.config')}.*`).length > 0) {
        projectConfig.push(
            ...compat.extends('plugin:cypress/recommended')
                .map(config => ({
                    ...config,
                    name: `${folder}:cypress`,
                    files: [`${rootFolder}*.spec.*`, `${rootFolder}*.test.*`, `${rootFolder}*.cy.*`]
                }))
        );
    }

    base.push(...projectConfig);
}

export default base;