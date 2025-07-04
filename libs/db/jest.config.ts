import { readFileSync } from 'fs';
import * as url from 'url';
import type { Options } from '@swc/core';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Reading the SWC compilation config and remove the "exclude"
// for the test files to be compiled by SWC
const { exclude: __unusedExclude, ...swcJestConfig } = JSON.parse(
    readFileSync(`${__dirname}/.swcrc`, 'utf-8')
) as Options;

// disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves.
// If we do not disable this, SWC Core will read .swcrc and won't transform our test files due to "exclude"
swcJestConfig.swcrc ??= false;

export default {
    displayName: 'db',
    preset: '../../jest.preset.cjs',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig]
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/libs/db'
};
