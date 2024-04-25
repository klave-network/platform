export const watExtractorModuleFunction = () => {
    const load = async () => {
        'use strict';

        const { parentPort } = await import('node:worker_threads');

        try {

            const wabt = (await import('wabt')).default;
            const wbatModule = await wabt();
            parentPort?.on('message', (message) => {
                if (message.type === 'start') {
                    try {
                        const wasmBuffer = message.data;
                        const wabtModuleDescriptor = wbatModule.readWasm(wasmBuffer, { readDebugNames: true });
                        parentPort.postMessage({
                            type: 'done',
                            wat: wabtModuleDescriptor.toText({ foldExprs: false, inlineExport: false })
                        });
                    } catch (error) {
                        console.error(error);
                        const result = new Error('Wat extractor service failure');
                        parentPort?.postMessage({
                            type: 'errored',
                            error: result,
                            stderr: result.toString()
                        });
                    }
                }
            });

        } catch (error) {
            console.error(error);
            const result = new Error('Compiler service failure');
            parentPort?.postMessage({
                type: 'errored',
                error: result,
                stderr: result.toString()
            });
        }
    };
    load()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
};