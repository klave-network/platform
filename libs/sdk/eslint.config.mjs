import baseConfig from '../../eslint.config.js';

export default [
    ...baseConfig,
    {
        files: ['**/eslint.config.mjs'],
        rules: {
            '@nx/enforce-module-boundaries': 'off'
        }
    }
];
