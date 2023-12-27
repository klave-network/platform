import { RequestHandler } from 'express-serve-static-core';
import { createNodeMiddleware, Probot } from 'probot';
import { probot } from '@klave/providers';
import probotApp from '../probot';

let middlewareReference: RequestHandler | undefined;
export const probotMiddleware: RequestHandler = (req, res, next) => {

    if (!middlewareReference && !(probot as Probot & { uninitialized?: boolean }).uninitialized)
        middlewareReference = createNodeMiddleware(probotApp, {
            probot
        });

    if (middlewareReference)
        return middlewareReference(req, res, next);
    else
        return next();
};
