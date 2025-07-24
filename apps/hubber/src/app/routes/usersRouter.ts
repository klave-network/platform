import { Router } from 'express';
import passport from 'passport';
import { createUser, getUsers } from '../controllers/userController';

export const usersRouter = Router();

usersRouter.get('/whoami', ({ user }, res) => {
    if (user)
        res.status(200).json({ me: user });
    else
        res.status(401).json({ who: 'An unknown unicorn' });
});

usersRouter.get('/login/print', (req, __unusedRes, next) => {
    req.body = {
        username: req.session.id,
        password: (req.session as (typeof req.session & { localId?: string })).localId
    };
    next();
}, passport.authenticate('local', {
    passReqToCallback: true
}), (req, res) => {
    res.status(200).json({ ...req.user });
});

usersRouter.get('/logout', (req, res) => {
    req.logout({
        keepSessionInfo: false
    }, () => {
        res.status(200).json({ success: true });
    });
});

usersRouter.get('/users', (__unusedReq, res) => {
    (async () => {
        res.status(200).json({
            users: await getUsers()
        });
    })()
        .catch(() => { return; });
});

usersRouter.post('/users', (req, res) => {
    (async () => {
        try {
            await createUser(req.body);
            res.status(200).json({ ok: true });
        } catch (e) {
            res.status(500).json({ ok: false, exception: process.env.NODE_ENV !== 'production' ? e : undefined });
        }
    })()
        .catch(() => { return; });
});

export default usersRouter;