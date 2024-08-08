import * as Sentry from '@sentry/node';
import type { Integration } from '@sentry/types';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { permissiblePeers } from '@klave/constants';

export const sentryOps = {
    initialize: async () => {
        try {
            console.info('Initializing Sentry');
            Sentry.init({
                dsn: process.env['KLAVE_DISPATCH_SENTRY_DSN'],
                release: `dispatcher@${process.env['GIT_REPO_VERSION']}`,
                environment: process.env['KLAVE_DISPATCH_SENTRY_ENV'] ?? process.env['NODE_ENV'] ?? 'development',
                integrations: [
                    // enable HTTP calls tracing
                    new Sentry.Integrations.Http({ tracing: true }) as Integration
                ].concat(process.env['NODE_ENV'] === 'development' ? [nodeProfilingIntegration()] : []),
                // Set tracesSampleRate to 1.0 to capture 100%
                // of transactions for performance monitoring.
                // We recommend adjusting this value in production
                tracesSampleRate: 1.0,
                tracePropagationTargets: permissiblePeers,
                profilesSampleRate: 1.0
            });

        } catch (e) {
            console.error(`Could not initialize Sentry: ${e}`);
        }
    }
};
