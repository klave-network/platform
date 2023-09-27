// import passport from 'passport';
// import { Strategy as LocalStrategy } from 'passport-local';
import type { RequestHandler } from 'express';
// import db from '../../utils/db';
// import { logger } from '@klave/providers';

// passport.serializeUser((user, cb) => {
//     logger.debug(`serializeUser ${typeof user} >> ${JSON.stringify(user)}`);
//     process.nextTick(function () {
//         return cb(null, {
//             id: user.id
//         });
//     });
// });

// passport.deserializeUser((user: Express.User, cb) => {
//     logger.debug(`deserializeUser ${typeof user} >> ${JSON.stringify(user)}`);
//     process.nextTick(function () {
//         return cb(null, user);
//     });
// });

// passport.use(new LocalStrategy({
//     passReqToCallback: true
// }, async (req, username, password, cb) => {
//     const { web, session, user } = req;
//     console.log('COUCOU >>>', web, session, user, username, password);
//     try {
//         if (!username || !password)
//             return cb(null, false, { message: 'User was not confirmed by remote device.' });
//         const existingUser = await db.user.findFirst({
//             where: { id: web.userId ?? undefined }
//         });
//         if (!existingUser)
//             return cb(null, false, { message: 'User was not confirmed by remote device.' });
//         cb(null, existingUser);
//     } catch (error) {
//         cb(error);
//     }
// }));

export const passportLoginCheckMiddleware: RequestHandler = (req, res, next) => {
    const user = req.user?.id ?? req.session?.user?.id ?? null;
    if (user !== null) {
        next();
    } else if (
        req.path === '/users/login' ||
        req.path === '/login/print' ||
        req.path === '/get_repos' ||
        req.path === '/whoami' ||
        req.path.match(/^\/trpc/)) {
        next();
    } else {
        res.status(400).json({ status: 'error', message: 'Please login first' });
    }
};