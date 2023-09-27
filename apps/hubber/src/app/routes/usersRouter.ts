import { Router } from 'express';
import passport from 'passport';
import { createUser, getUsers } from '../controllers/userController';

export const usersRouter = Router();

usersRouter.get('/whoami', async ({ user, web }, res) => {
    if (user)
        res.status(200).json({ me: user });
    else
        res.status(401).json({ who: 'An unknown unicorn', hasGithubToken: !!web.githubToken });
});

usersRouter.get('/login/print', async (req, __unusedRes, next) => {
    req.body = {
        username: req.session.id,
        password: (req.session as any).localId
    };
    next();
}, passport.authenticate('local', {
    passReqToCallback: true
}), async (req, res) => {
    res.status(200).json({ ...req.user });
});

usersRouter.get('/logout', async (req, res) => {
    req.logout({
        keepSessionInfo: false
    }, () => {
        res.status(200).json({ success: true });
    });
});

usersRouter.get('/users', async (__unusedReq, res) => {
    res.status(200).json({
        users: await getUsers()
    });
});

usersRouter.post('/users', async (req, res) => {
    try {
        await createUser(req.body);
        res.status(200).json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, exception: process.env.NODE_ENV !== 'production' ? e : undefined });
    }
});

export default usersRouter;