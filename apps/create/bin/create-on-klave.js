#!/usr/bin/env node

const SILENCED_ERRORS = [
    'DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.'
];


const originalError = console.error;

console.error = (msg) => {
    const isSilencedError = SILENCED_ERRORS.some(
        error => typeof msg === 'string' && msg.includes(error)
    );
    if (isSilencedError) {
        return;
    }
    originalError(msg);
};


if (typeof require !== 'undefined')
    require('../src/index.js');
else
    import('../src/index.js');
