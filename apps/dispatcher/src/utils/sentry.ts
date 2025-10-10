import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config, permissiblePeers } from '@klave/constants';

export const sentryOps = {
    initialize: async () => {
        try {
            console.info('Initializing Sentry');
            Sentry.init({
                dsn: config.get('KLAVE_DISPATCH_SENTRY_DSN'),
                release: `dispatcher@${config.get('GIT_REPO_VERSION')}`,
                environment: config.get('KLAVE_DISPATCH_SENTRY_ENV', process.env['NODE_ENV'] ?? 'development'),
                integrations: [
                    // enable HTTP calls tracing
                    Sentry.httpIntegration(),
                    Sentry.httpServerIntegration(),
                    Sentry.httpServerSpansIntegration(),
                    Sentry.mongoIntegration()
                ].concat(config.get('NODE_ENV') === 'development' ? [nodeProfilingIntegration()] : []),
                // Set tracesSampleRate to 1.0 to capture 100%
                // of transactions for performance monitoring.
                // We recommend adjusting this value in production
                tracesSampleRate: 1.0,
                tracePropagationTargets: permissiblePeers,
                profilesSampleRate: 1.0,
                profileLifecycle: 'trace'
            });

        } catch (e) {
            console.error(`Could not initialize Sentry: ${e}`);
        }
    }
};
