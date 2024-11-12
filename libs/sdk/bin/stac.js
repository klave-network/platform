#!/usr/bin/env node
/* eslint-disable */

if (typeof require !== 'undefined')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../compile.js');
else
    import('../compile.js');
