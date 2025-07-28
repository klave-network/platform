import url from 'url';
import path from 'node:path';
import expectCt from 'expect-ct';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import multer from 'multer';
import cors from 'cors';
import passport from 'passport';
import * as swaggerUi from 'swagger-ui-express';
import { v4 as uuid } from 'uuid';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from '@klave/db';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { morganLoggerMiddleware } from './middleware/morganLogger';
import { integrationCredsRenewalMiddleware } from './middleware/integrations';
import { probotMiddleware, probotMiddlewareHandlerRegistration } from './middleware/probot';
import { stripeMiddlware } from './middleware/stripe';
import { sentryRequestMiddleware, sentryTracingMiddleware, sentryErrorMiddleware } from './middleware/sentry';
import { passportLoginCheckMiddleware } from './middleware/passport';
import { trcpMiddlware } from './middleware/trpc';
import { openAPIMiddleware, openAPIDocument } from './middleware/openapi';
// import { i18nextMiddleware } from './middleware/i18n';
// import { getDriverSubstrate } from '../utils/db';
import { usersRouter } from './routes';
import { config, permissiblePeers } from '@klave/constants';
import { uiHosterMiddleware } from './middleware/uiHoster';
import { mcpMiddleware } from './middleware/mcp';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const bhuiHostDomain = URL.parse(config.get('KLAVE_BHDUI_DOMAIN'))?.host;

const app = express();

export const start = async () => {

    const __hostname = config.get('HOSTNAME', 'unknown');

    app.use(sentryRequestMiddleware);
    app.use(sentryTracingMiddleware);
    app.use(morganLoggerMiddleware);
    app.use(rateLimiterMiddleware);
    app.use(express.json({
        limit: '10mb',
        verify: (req, __unusedRed, buf) => {
            (req as unknown as Record<string, object>).rawBody = buf;
        }
    }));
    app.use(express.urlencoded({
        extended: true,
        limit: '10mb'
    }));

    // app.use(i18nextMiddleware);
    app.use(multer().none());
    app.disable('X-Powered-By');
    app.use((__unusedReq, res, next) => {
        res.setHeader('X-Klave-API-Node', __hostname);
        next();
    });
    app.use(helmet.frameguard({ action: 'sameorigin' }));
    app.use(helmet.hidePoweredBy());
    app.use(helmet({
        // crossOriginEmbedderPolicy: false,
        // crossOriginResourcePolicy: false,
        // crossOriginOpenerPolicy: false,
        // contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: {
            policy: 'credentialless'
        },
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        },
        crossOriginOpenerPolicy: {
            policy: 'same-origin'
        },
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                // 'default-src': ['"self"', 'data:', 'blob:'],
                // 'script-src': ['"self"', 'unsafe-inline', 'unsafe-eval', 'https://*.klave.dev', 'https://*.klave.network', 'https://*.ingest.sentry.io'],
                // 'style-src': ['"self"', 'unsafe-inline', 'https://*.klave.dev', 'https://*.klave.network'],
                'frame-src': ['\'self\'', '*.127.0.0.1.nip.io:*', '*.klave.dev', '*.klave.network', 'klave.network', '*.klave.com', 'klave.com'].concat(bhuiHostDomain ? [`*.${bhuiHostDomain}`, bhuiHostDomain] : []),
                'frame-ancestors': ['\'self\'', '*.127.0.0.1.nip.io:*', '*.klave.dev', '*.klave.network', 'klave.network', '*.klave.com', 'klave.com'],
                'connect-src': ['\'self\'', '*']
                // upgradeInsecureRequests: true,
                // blockAllMixedContent: true
            }
            // reportOnly: true
            // directives: {
            //     'img-src': ['"self"', 'data:', 'blob:', '"https://*.githubusercontent.com"'],
            //     'frame-src': ['"self"', '"https://*.klave.dev"', '"https://*.klave.network"', '"https://klave.network"'],
            //     'connect-src': ['"self"', '"https://*.klave.dev"', '"https://*.klave.network"', '"https://*.ingest.sentry.io"']
            // }
        }
    }));

    const corsConfiguration = cors({
        origin: permissiblePeers,
        // preflightContinue: true,
        // allowedHeaders: ['Sentry-Trace', 'Baggage'],
        credentials: true
    });

    app.options('*', corsConfiguration);
    app.use(corsConfiguration);

    app.use(
        expectCt({
            enforce: true,
            maxAge: 90
        })
    );

    // Plug Probot for GitHub Apps
    probotMiddlewareHandlerRegistration(app);
    app.use('/hook', (req, res, next) => {
        if (req.headers['x-github-event'])
            probotMiddleware(req, res, next);
        else if (req.headers['stripe-signature'])
            stripeMiddlware(req, res, next);
        else
            next();
    });

    const sessionOptions: session.SessionOptions = {
        secret: config.get('KLAVE_EXPRESS_SESSION_SECRETS').split(',') ?? [],
        // Don't save session if unmodified
        resave: true,
        // Don't create session until something stored
        saveUninitialized: true,
        // store: MongoStore.create(mongoOptions),
        store: new PrismaSessionStore(
            prisma,
            {
                checkPeriod: 2 * 60 * 1000,  //ms
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined,
                sessionModelName: 'session'
            }
        ),
        genid: () => uuid()
    };

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1); // trust first proxy
        sessionOptions.cookie = { secure: true }; // serve secure cookies
    }

    // TODO - Remove in a few versions
    app.use('/ping', (__unusedReq, res) => {
        res.setHeader('X-Klave-API-Status', 'ready');
        res.status(202).send({
            ping: true,
            node: __hostname
        });
    });

    app.use('/version', (__unusedReq, res) => {

        prisma.$runCommandRaw({
            count: 'session'
        }).then(() => {
            res.setHeader('X-Klave-API-Status', 'ready');
            res.status(202).send({
                version: {
                    name: process.env.NX_TASK_TARGET_PROJECT,
                    commit: process.env.GIT_REPO_COMMIT?.substring(0, 8),
                    branch: process.env.GIT_REPO_BRANCH,
                    version: process.env.GIT_REPO_VERSION
                },
                node: __hostname
            });
        }).catch((e) => {
            console.error('Database connection failed', e, (e as Error)?.stack);
            res.status(500).send({
                error: 'Database connection failed',
                message: e?.toString()
            });
        });
    });

    app.use(uiHosterMiddleware);
    app.use(session(sessionOptions));
    app.use('/', express.static(path.join(__dirname, 'public')));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(integrationCredsRenewalMiddleware);
    app.use(passportLoginCheckMiddleware);
    app.use('/mcp', mcpMiddleware);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openAPIDocument));
    app.use('/o', openAPIMiddleware);
    app.use('/trpc', trcpMiddlware);
    app.use(usersRouter);
    app.use(sentryErrorMiddleware);
    app.all('*', (req, res) => {
        res.json({
            path: req.path,
            hubber: true,
            ok: true
        });
    });

    return app;
};

export default start;