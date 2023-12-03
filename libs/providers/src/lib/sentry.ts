import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import * as SecretariumInstruments from '@secretarium/instrumentation';
import { prisma } from '@klave/db';
import { logger, scp as scpClient, scpOps } from '..';
import { permissiblePeers } from '@klave/constants';

export const sentryOps = {
    initialize: async () => {
        try {
            logger.info('Initializing Sentry');
            Sentry.init({
                dsn: process.env['KLAVE_SENTRY_DSN'],
                release: `klave@${process.env['GIT_REPO_VERSION']}`,
                environment: process.env['KLAVE_SENTRY_ENV'] ?? process.env['NODE_ENV'] ?? 'development',
                integrations: [
                    // enable HTTP calls tracing
                    new Sentry.Integrations.Http({ tracing: true }),
                    // enable Express.js middleware tracing
                    // see Express middlware instantiation
                    // new Sentry.Integrations.Express({
                    //     app
                    // }),
                    new Sentry.Integrations.Prisma({
                        client: prisma
                    }),
                    new Sentry.Integrations.Mongo(),
                    new SecretariumInstruments.Sentry.ConnectorTracing({
                        connector: scpClient,
                        domains: ['.sta.klave.network']
                    })
                ].concat(process.env['NODE_ENV'] === 'development' ? [new ProfilingIntegration()] : []),
                // Set tracesSampleRate to 1.0 to capture 100%
                // of transactions for performance monitoring.
                // We recommend adjusting this value in production
                tracesSampleRate: 1.0,
                tracePropagationTargets: permissiblePeers,
                profilesSampleRate: 1.0,
                beforeSend: (event) => {
                    const secretariumVersion = scpOps.version();
                    if (!event.tags)
                        event.tags = {};
                    event.tags['secretarium.core'] = secretariumVersion.core;
                    event.tags['secretarium.wasm'] = secretariumVersion.wasm;
                    return event;
                }
            });

        } catch (e) {
            logger.error(`Could not initialize Sentry: ${e}`);
        }
    }
};
