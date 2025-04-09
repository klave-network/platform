{
    const SILENCED_ERRORS = [
        'DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.'
    ];


    const originalError = console.error;

    console.error = (msg: unknown) => {
        const isSilencedError = SILENCED_ERRORS.some(
            error => typeof msg === 'string' && msg.includes(error)
        );
        if (isSilencedError) {
            return;
        }
        originalError(msg);
    };
}

import { runCli } from './main';

const main = async () => {
    await runCli();
};

main();
