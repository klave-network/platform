import { RequestHandler } from 'express-serve-static-core';
import { createNodeMiddleware, Probot } from 'probot';
import { probot } from '@klave/providers';
import probotApp from '../probot';

let middlewareReference: RequestHandler | undefined;
export const probotMiddleware: RequestHandler = async (req, res, next) => {

    if (!middlewareReference && !(probot as Probot & { uninitialized?: boolean }).uninitialized)
        middlewareReference = createNodeMiddleware(probotApp, {
            probot,
            webhooksPath: '/'
        });

    if (middlewareReference)
        middlewareReference(req, res, next);
    else
        next();
};
