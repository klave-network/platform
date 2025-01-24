import ip from 'ip';
import url from 'url';
import path from 'node:path';
import expectCt from 'expect-ct';
import express from 'express';
import session from 'express-session';
import ews from 'express-ws';
import helmet from 'helmet';
import multer from 'multer';
import cors from 'cors';
// import { csrfSync } from 'csrf-sync';
import passport from 'passport';
// import { Strategy as LocalStrategy } from 'passport-local';
// import MongoStore from 'connect-mongo';
import { v4 as uuid } from 'uuid';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from '@klave/db';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { morganLoggerMiddleware } from './middleware/morganLogger';
import { probotMiddleware } from './middleware/probot';
import { stripeMiddlware } from './middleware/stripe';
import { sentryRequestMiddleware, sentryTracingMiddleware, sentryErrorMiddleware } from './middleware/sentry';
import { passportLoginCheckMiddleware } from './middleware/passport';
import { trcpMiddlware } from './middleware/trpc';
// import { i18nextMiddleware } from './middleware/i18n';
// import { getDriverSubstrate } from '../utils/db';
import { usersRouter } from './routes';
import { logger } from '@klave/providers';
import { webLinkerMiddlware } from './middleware/webLinker';
import { permissiblePeers } from '@klave/constants';
import type { WebSocket, Server } from 'ws';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const eapp = express();
const { app, getWss } = ews(eapp, undefined, {
    // leaveRouterUntouched: true,
    wsOptions: {
        path: '/bridge',
        // noServer: true,
        clientTracking: true
    }
});

export const start = async (port: number) => {

    const __hostname = process.env['HOSTNAME'] ?? 'unknown';

    app.use(sentryRequestMiddleware);
    app.use(sentryTracingMiddleware);
    app.use(morganLoggerMiddleware);
    app.use(rateLimiterMiddleware);
    app.use(express.json({
        verify: (req, __unusedRed, buf) => {
            (req as unknown as Record<string, object>).rawBody = buf;
        }
    }));
    app.use(express.urlencoded({ extended: true }));
    // app.use(i18nextMiddleware);
    app.use(multer().none());
    app.disable('X-Powered-By');
    app.use((__unusedReq, res, next) => {
        res.setHeader('X-Klave-API-Node', __hostname);
        next();
    });
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
            useDefaults: true
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
    app.use('/hook', async (req, res, next) => {
        if (req.headers['x-github-event'])
            probotMiddleware(req, res, next);
        else if (req.headers['stripe-signature'])
            stripeMiddlware(req, res, next);
        else
            next();
    });

    // const {
    //     generateToken,
    //     csrfSynchronisedProtection
    // } = csrfSync();

    // const mongoOptions = {
    //     client: getDriverSubstrate(),
    //     collectionName: 'sessions'
    // };

    const sessionOptions: session.SessionOptions = {
        secret: process.env.KLAVE_EXPRESS_SESSION_SECRETS?.split(',') ?? [],
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

    app.get('/ping', (__unusedReq, res) => {
        res.setHeader('X-Klave-API-Status', 'ready');
        res.json({ pong: true, node: __hostname });
    });

    app.use(session(sessionOptions));
    app.use('/', express.static(path.join(__dirname, 'public')));
    // app.get('/csrf-token', (req, res) => res.json({ token: generateToken(req) }));
    // app.use(csrfSynchronisedProtection);
    app.use(passport.initialize());
    app.use(passport.session());


    // passport.serializeUser((user, done) => {
    //     logger.debug(`serializeUser ${typeof user} >> ${JSON.stringify(user)}`);
    //     process.nextTick(function () {
    //         done(null, user.id);
    //     });
    // });

    // passport.deserializeUser((id: string, done) => {
    //     logger.debug(`deserializeUser ${typeof id} >> ${id}`);
    //     prisma.user.findUnique({ where: { id } })
    //         .then((user) => {
    //             process.nextTick(function () {
    //                 done(null, user);
    //             });
    //         })
    //         .catch((err) => {
    //             process.nextTick(function () {
    //                 done(err, null);
    //             });
    //         });
    // });

    // passport.use(new LocalStrategy({
    //     passReqToCallback: true
    // }, (req, username, password, done) => {
    //     const { web, session, user } = req;
    //     prisma.user.findUnique({ where: { id: user?.id } })
    //         .then((user) => {
    //             if (!user) return done(null, false);
    //             if (password !== (user as any).password) {
    //                 return done(null, false);
    //             } else {
    //                 return done(null, user);
    //             }
    //         })
    //         .catch((err) => { return done(err); });
    // }));

    // Contextualise user session, devices, tags, tokens
    app.use(webLinkerMiddlware);

    app.ws('/bridge', (ws: WebSocket, { session, sessionID, sessionStore }) => {
        type WsWithSession = typeof ws & { sessionID: string };
        type SessionWithLocator = typeof session & { locator?: string, localId?: string };
        (ws as WsWithSession).sessionID = sessionID;
        ws.on('connection', (ws) => {
            ws.isAlive = true;
            logger.info('PLR: Client is alive !');
        });
        ws.on('upgrade', () => {
            logger.info('PLR: Client is upgrading ...');
        });
        ws.on('message', (msg) => {
            const [verb, ...data] = msg.toString().split('#');
            if (verb === 'request') {
                logger.info('New Pocket login bridge client request ...');
                const [locator] = data;
                (session as SessionWithLocator).locator = locator;
                session.save(() => {
                    ws.send(`sid#${sessionID}#ws://${ip.address('public')}:${port}/bridge`);
                });
                return;
            } else if (verb === 'confirm') {
                logger.info('PLR: New remote device confirmation ...');
                const [sid, locator, localId] = data;
                if (sid !== sessionID)
                    return;
                sessionStore.get(sid, (err, rsession) => {
                    if (err) {
                        logger.error(`Pocket API bridge experienced an issue: ${err}`);
                        return;

                    } if (!rsession)
                        return;
                    if ((rsession as SessionWithLocator).locator !== locator)
                        return;
                    (rsession as SessionWithLocator).localId = localId;
                    sessionStore.set(sid, rsession, () => {
                        const browserTarget = Array.from((getWss() as Server).clients.values()).find(w => (w as WsWithSession).sessionID === sid);
                        browserTarget?.send('confirmed');
                    });
                });
            }
            ws.send(msg);
        });
    });

    app.use(passportLoginCheckMiddleware);
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