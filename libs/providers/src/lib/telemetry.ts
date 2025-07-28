import { logger } from '..';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

export const telemetryOps = {
    initialize: async () => {
        try {
            logger.info('Initializing Telemetry');

            const traceExporter = new ConsoleSpanExporter();
            const sdk = new NodeSDK({
                serviceName: 'hubber',
                traceExporter,
                instrumentations: [
                    new PrismaInstrumentation({
                        enabled: true,
                        middleware: true
                    })
                ]
            });

            sdk.start();

            process.on('SIGTERM', () => {
                (async () => {
                    try {
                        await sdk.shutdown();
                        console.log('Tracing shut down successfully');
                    } catch (err) {
                        console.error('Error shutting down tracing', err);
                    } finally {
                        process.exit(0);
                    }
                })().catch((err) => {
                    console.error('Error during graceful shutdown', err);
                });
            });

        } catch (e) {
            logger.error(`Could not initialize Telemetry: ${e}`);
        }
    }
};
