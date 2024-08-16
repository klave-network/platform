import baseConfig from '../../eslint.config.js';

export default [
    ...baseConfig,
    {
        files: ['**/eslint.config.js'],
        rules: {
            '@nx/enforce-module-boundaries': 'off'
        }
    }
];
