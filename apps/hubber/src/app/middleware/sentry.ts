import { RequestHandler, ErrorRequestHandler } from 'express-serve-static-core';
import * as Sentry from '@sentry/node';
import type { Application } from 'express';

let sentryRequestMiddlewareReference: RequestHandler;
let sentryTracingMiddlewareReference: RequestHandler;
let sentryErrorMiddlewareReference: ErrorRequestHandler;

const initializeSentry = (app: Application) => {

    // enable Express.js middleware tracing
    Sentry.addIntegration(new Sentry.Integrations.Express({
        app
    }));

    const fork = <Handler>(func: () => Handler) => {
        if (process.env.NODE_ENV === 'test')
            return () => {
                //
            };
        return func();
    };

    sentryRequestMiddlewareReference = fork(Sentry.Handlers.requestHandler);
    sentryTracingMiddlewareReference = fork(Sentry.Handlers.tracingHandler);
    sentryErrorMiddlewareReference = fork<ErrorRequestHandler>(Sentry.Handlers.errorHandler);
};

export const sentryRequestMiddleware: RequestHandler = async (req, res, next) => {

    if (!sentryRequestMiddlewareReference)
        initializeSentry(req.app);
    sentryRequestMiddlewareReference(req, res, next);
};

export const sentryTracingMiddleware: RequestHandler = async (req, res, next) => {

    if (!sentryTracingMiddlewareReference)
        initializeSentry(req.app);
    sentryTracingMiddlewareReference(req, res, next);
};

export const sentryErrorMiddleware: ErrorRequestHandler = async (err, req, res, next) => {

    if (!sentryErrorMiddlewareReference)
        initializeSentry(req.app);
    sentryErrorMiddlewareReference(err, req, res, next);
};