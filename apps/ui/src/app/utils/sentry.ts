import * as Sentry from '@sentry/react';
import {
    createBrowserRouter,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes
} from 'react-router-dom';
import { useEffect } from 'react';
import { permissiblePeers } from '@klave/constants';

Sentry.init({
    dsn: import.meta.env['VITE_KLAVE_SENTRY_DSN'],
    release: `klave@${import.meta.env['VITE_REPO_VERSION']}`,
    environment: ['localhost', '::', '127.0.0.1', '127.0.0.1.nip.io'].includes(window.location.hostname) ? 'development' : window.location.hostname,
    integrations: [
        Sentry.httpClientIntegration(),
        Sentry.browserTracingIntegration({
            enableHTTPTimings: true,
            enableLongTask: true
        }),
        Sentry.reactRouterV6BrowserTracingIntegration({
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
        }),
        Sentry.replayIntegration()
    ],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    tracePropagationTargets: permissiblePeers
});

export const sentryCreateBrowserRouter = Sentry.wrapCreateMemoryRouterV6(
    createBrowserRouter
);