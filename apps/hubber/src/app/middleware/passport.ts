import type { RequestHandler } from 'express';

export const passportLoginCheckMiddleware: RequestHandler = (req, res, next) => {
    const user = req.user?.id ?? req.session?.user?.id ?? null;
    if (user !== null) {
        next();
    } else if (
        req.path === '/users/login' ||
        req.path === '/login/print' ||
        req.path === '/get_repos' ||
        req.path === '/whoami' ||
        req.path.match(/^\/mcp/) ||
        req.path.match(/^\/trpc/)
    ) {
        next();
    } else {
        res.status(400).json({ status: 'error', message: 'Please login first' });
    }
};