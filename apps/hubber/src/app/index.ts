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

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const eapp = express();
const { app, getWss } = ews(eapp, undefined, {
    // leaveRouterUntouched: true,
    wsOptions: {
        path: '/api/bridge',
        // noServer: true,
        clientTracking: true
    }
});

const getApiRouter = (/*port: number*/) => {
    const router = express();
    // const { app: router, getWss } = ews(express(), undefined, {
    //     // leaveRouterUntouched: true,
    //     wsOptions: {
    //         path: '/api/bridge'
    //         // noServer: true,
    //         // clientTracking: true
    //     }
    // });

    // app.ws('/api/bridge', (ws, { session, sessionID, sessionStore }) => {
    //     (ws as any).sessionID = sessionID;
    //     ws.on('connection', (ws) => {
    //         ws.isAlive = true;
    //         logger.info('Client is alive !');
    //     });
    //     ws.on('upgrade', () => {
    //         logger.info('Client is upgrading ...');
    //     });
    //     ws.on('message', (msg) => {
    //         // if (!session)
    //         //     return;
    //         const [verb, ...data] = msg.toString().split('#');
    //         if (verb === 'request') {
    //             logger.info('New bridge client request ...');
    //             const [locator] = data;
    //             (session as any).locator = locator;
    //             session.save(() => {
    //                 ws.send(`sid#${sessionID}#ws://${ip.address('public')}:${port}/bridge`);
    //             });
    //             return;
    //         } else if (verb === 'confirm') {
    //             logger.info('New remote device confirmation ...');
    //             const [sid, locator, localId] = data;
    //             sessionStore.get(sid, (err, rsession) => {
    //                 if (!rsession)
    //                     return;
    //                 if ((rsession as any).locator !== locator)
    //                     return;
    //                 (rsession as any).localId = localId;
    //                 sessionStore.set(sid, rsession, () => {
    //                     const browserTarget = Array.from(getWss().clients.values()).find(w => (w as any).sessionID === sid);
    //                     browserTarget?.send('confirmed');
    //                 });
    //             });
    //         }
    //         ws.send(msg);
    //     });
    // });

    router.use(passportLoginCheckMiddleware);
    router.use('/trpc', trcpMiddlware);
    router.use(usersRouter);

    router.all('*', (req, res) => {
        res.json({
            path: req.path,
            hubber: true,
            ok: true
        });
    });

    return router;
};

export const start = async (port: number) => {

    const apiRouter = getApiRouter(/*port*/);

    app.use(sentryRequestMiddleware);
    app.use(sentryTracingMiddleware);
    app.use(morganLoggerMiddleware);
    app.use(rateLimiterMiddleware);
    app.use(cors({
        origin: ['chrome-extension://', `http://localhost:${port}`, `http://127.0.0.1:${port}`, /\.klave\.network$/, /\.klave\.dev$/, /\.klave\.com$/, /\.secretarium\.com$/, /\.secretarium\.org$/],
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // app.use(i18nextMiddleware);
    app.use(multer().none());
    app.use(helmet({
        crossOriginEmbedderPolicy: {
            policy: 'credentialless'
        },
        // crossOriginOpenerPolicy: false,
        contentSecurityPolicy: false
        // {
        //     useDefaults: true,
        //     directives: {
        //         'img-src': ['"self"', 'data:', 'blob:', '"https://*.githubusercontent.com"'],
        //         'frame-src': ['"self"', '"https://*.klave.dev"', '"https://*.klave.network"', '"https://klave.network"'],
        //         'connect-src': ['"self"', '"https://*.klave.dev"', '"https://*.klave.network"', '"https://*.ingest.sentry.io"']
        //     }
        // }
    }));
    app.use(
        expectCt({
            enforce: true,
            maxAge: 90
        })
    );
    app.disable('x-powered-by');

    // Plug Probot for GitHub Apps
    app.use('/hook', (req, res, next) => {
        if (req.headers['x-github-event'])
            return probotMiddleware(req, res);
        if (req.headers['stripe-signature'])
            return stripeMiddlware(req, res, next);
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
        res.json({ pong: true });
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

    app.ws('/api/bridge', (ws, { session, sessionID, sessionStore }) => {
        (ws as any).sessionID = sessionID;
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
                (session as any).locator = locator;
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
                    if ((rsession as any).locator !== locator)
                        return;
                    (rsession as any).localId = localId;
                    sessionStore.set(sid, rsession, () => {
                        const browserTarget = Array.from(getWss().clients.values()).find(w => (w as any).sessionID === sid);
                        browserTarget?.send('confirmed');
                    });
                });
            }
            ws.send(msg);
        });
    });
    app.use('/api', apiRouter);
    // app.use(apiRouter);

    app.use(sentryErrorMiddleware);

    app.use('*', express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

    return app;
};

export default start;