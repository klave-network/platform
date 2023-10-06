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

Sentry.init({
    dsn: process.env['NX_SENTRY_DSN'],
    release: 'klave@0.0.0',
    environment: ['localhost', '::', '127.0.0.1'].includes(window.location.hostname) ? 'development' : window.location.hostname,
    integrations: [
        new BrowserTracing({
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
            domains: ['.sta.klave.network']
        }),
        new Sentry.Replay()
    ],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 1.0
});

export const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
    createBrowserRouter
);