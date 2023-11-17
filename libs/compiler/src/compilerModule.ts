// import Transformer from '@klave/as-json/transform/src/index';

export const compilerModuleFunction = () => {
    const load = async () => {
        'use strict';

        const { parentPort } = await import('node:worker_threads');
        const { PassThrough } = await import('node:stream');

        try {
            const { serializeError } = await import('serialize-error');
            const assemblyscript = await import('assemblyscript/dist/asc.js');

            /** @type {import('@klave/as-json/transform/src/index')} */
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const { default: JSONTranform } = await import('@klave/as-json/transform/lib/index.js');

            /** @type {import('assemblyscript/dist/asc.d.ts')} */
            const asc = assemblyscript;
            const pendingResolves: Record<number, (value: string | PromiseLike<string | null> | null) => void> = {};
            let pendingReadIdentifier = 0;

            const compileStdOut = new PassThrough();
            const compileStdErr = new PassThrough();

            parentPort?.on('message', (message) => {
                if (message.type === 'compile') {
                    parentPort.postMessage({
                        type: 'start',
                        version: asc.version
                    });
                    asc.main([
                        '.',
                        '--exportRuntime',
                        '-O', '--noAssert',
                        '--optimizeLevel', '3',
                        '--shrinkLevel', '2',
                        '--converge',
                        // '--transform', '@klave/as-json/transform',
                        '--bindings', 'esm',
                        '--outFile', 'out.wasm',
                        '--textFile', 'out.wat'
                    ], {
                        stdout: compileStdOut,
                        stderr: compileStdErr,
                        reportDiagnostic: (diagnostics) => {
                            parentPort.postMessage({
                                type: 'diagnostic',
                                diagnostics
                            });
                        },
                        transforms: [
                            new JSONTranform()
                        ],
                        readFile: async (filename) => {
                            const currentReadIdentifier = pendingReadIdentifier++;
                            return new Promise<string | null>((resolve) => {
                                setTimeout(() => {
                                    if (process.env['DEBUG'] === 'true')
                                        console.debug('faile_read_bail:' + filename);
                                    resolve(null);
                                }, 5000);
                                pendingResolves[currentReadIdentifier] = resolve;
                                parentPort.postMessage({
                                    type: 'read',
                                    filename,
                                    id: currentReadIdentifier
                                });
                            }).catch(() => {
                                const resolve = pendingResolves[currentReadIdentifier];
                                delete pendingResolves[currentReadIdentifier];
                                return resolve?.(null) ?? Promise.resolve(null);
                            });
                        },
                        writeFile: async (filename, contents) => {
                            parentPort.postMessage({
                                type: 'write',
                                filename,
                                contents
                            });
                        }
                    }).then((result) => {

                        let chunk;
                        let actualStdOut = '';
                        while (null !== (chunk = compileStdOut.read()))
                            actualStdOut += String(chunk);
                        let actualStdErr = '';
                        while (null !== (chunk = compileStdErr.read()))
                            actualStdErr += String(chunk);

                        if (result.error) {
                            parentPort.postMessage({
                                type: 'errored',
                                error: serializeError(result.error),
                                stdout: actualStdOut,
                                stderr: actualStdErr
                            });
                        } else
                            parentPort.postMessage({
                                type: 'done',
                                stats: result.stats.toString(),
                                stdout: actualStdOut,
                                stderr: actualStdErr
                            });
                    }).catch((error) => {
                        parentPort.postMessage({
                            type: 'errored',
                            error: serializeError(error)
                        });
                    });
                } else if (message.type === 'read') {
                    if (pendingResolves[message.id]) {
                        pendingResolves[message.id]?.(message.contents);
                        delete pendingResolves[message.id];
                    }
                }
            });
        } catch (error) {
            parentPort?.postMessage({
                type: 'errored',
                error: new Error('Compiler service failure')
            });
        }
    };
    load();
};