'use strict';

import { parentPort } from 'node:worker_threads';
import { PassThrough } from 'node:stream'; 'node:stream';
import { serializeError } from 'serialize-error';
import assemblyscript from 'assemblyscript/asc';
import JSONTranform from '@klave/as-json/transform/lib/index.js';

/** @type {import('assemblyscript/dist/asc.d.ts')} */
const asc = assemblyscript;
const pendingResolves = {};
let pendingReadIdentifier = 0;

const compileStdOut = new PassThrough();
const compileStdErr = new PassThrough();

parentPort.on('message', (message) => {
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
                return await new Promise((resolve) => {
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
                    pendingResolves[currentReadIdentifier](null);
                    delete pendingResolves[currentReadIdentifier];
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
            pendingResolves[message.id](message.contents);
            delete pendingResolves[message.id];
        }
    }
});