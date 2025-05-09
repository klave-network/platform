import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';
import * as SecretariumInstruments from '@secretarium/instrumentation';
import {
    createBrowserRouter,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes
} from 'react-router-dom';
import { useEffect } from 'react';
import { client as scpClient } from './secretarium';
import { permissiblePeers } from '@klave/constants';

Sentry.init({
    dsn: import.meta.env['VITE_KLAVE_SENTRY_DSN'],
    release: `klave@${import.meta.env['VITE_REPO_VERSION']}`,
    environment: ['localhost', '::', '127.0.0.1', '127.0.0.1.nip.io'].includes(window.location.hostname) ? 'development' : window.location.hostname,
    integrations: [
        new BrowserTracing({
            enableHTTPTimings: true,
            enableLongTask: true,
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes
            )
        }),
        new SecretariumInstruments.Sentry.ConnectorTracing({
            connector: scpClient,
            domains: ['.klave.network']
        }),
        new Sentry.Replay()
    ],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    tracePropagationTargets: permissiblePeers
});

export const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
    createBrowserRouter
);