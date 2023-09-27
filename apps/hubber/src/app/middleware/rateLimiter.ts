import { RequestHandler } from 'express-serve-static-core';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 1000,
    duration: 1
});

export const rateLimiterMiddleware: RequestHandler = (req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).json('Too Many Requests');
        });
};
