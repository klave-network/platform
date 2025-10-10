import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger, scpOps } from '..';
import { config, permissiblePeers } from '@klave/constants';

export const sentryOps = {
    initialize: async () => {
        try {
            logger.info('Initializing Sentry');
            Sentry.init({
                dsn: config.get('KLAVE_SENTRY_DSN'),
                release: `klave@${config.get('GIT_REPO_VERSION')}`,
                environment: config.get('KLAVE_SENTRY_ENV', process.env['NODE_ENV'] ?? 'development'),
                integrations: [
                    // enable HTTP calls tracing
                    Sentry.httpIntegration(),
                    Sentry.httpServerIntegration(),
                    Sentry.httpServerSpansIntegration(),
                    Sentry.expressIntegration(),
                    Sentry.prismaIntegration(),
                    Sentry.mongoIntegration(),
                ].concat(config.get('NODE_ENV') === 'development' ? [nodeProfilingIntegration()] : []),
                // Set tracesSampleRate to 1.0 to capture 100%
                // of transactions for performance monitoring.
                // We recommend adjusting this value in production
                tracesSampleRate: 1.0,
                tracePropagationTargets: permissiblePeers,
                profilesSampleRate: 1.0,
                profileLifecycle: 'trace',
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
