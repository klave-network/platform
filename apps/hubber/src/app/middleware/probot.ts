import { Express, RequestHandler } from 'express-serve-static-core';
import { createNodeMiddleware } from 'probot';
import { probotOps, dispatchOps } from '@klave/providers';
import probotApp from '../probot';
import { createRequest, createResponse } from 'node-mocks-http';
import { Writable, Readable } from 'node:stream';

let middlewareReference: RequestHandler | undefined;
let isCreatingNodeMiddleware = false;

export const probotMiddleware: RequestHandler = (req, res, next) => {
    (async () => {
        const probot = probotOps.getProbot();
        if (!middlewareReference && probot && !isCreatingNodeMiddleware) {
            isCreatingNodeMiddleware = true;
            const middleware = await createNodeMiddleware(probotApp, {
                probot,
                webhooksPath: '/'
            });
            middlewareReference = middleware as RequestHandler;
        }
        if (middlewareReference)
            middlewareReference(req, res, next);
        else
            next();
    })().catch((error) => {
        console.error('Probot middleware error:', error);
        next(error);
    });
};

type HExpress = Express & {
    handle: RequestHandler;
};

export const probotMiddlewareHandlerRegistration = (app: Express) => {
    dispatchOps.registerHookHandler((reqInfo) => {
        try {

            const { headers, body } = reqInfo;
            const dHeaders: Record<string, string> = {
                host: 'localhost'
            };

            if (Array.isArray(headers)) {
                headers.forEach(([key, value]) => {
                    dHeaders[key] = value;
                });
            } else if (typeof headers === 'object') {
                Object.entries(headers).forEach(([key, value]) => {
                    dHeaders[key] = value;
                });
            }

            if (!dHeaders['x-github-event'])
                return;

            let dBody = Buffer.from(new ArrayBuffer(0));
            if (body) {
                if (typeof body === 'string') {
                    dBody = Buffer.from(body);
                } else if (Buffer.isBuffer(body)) {
                    dBody = body;
                } else if (ArrayBuffer.isView(body)) {
                    dBody = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
                } else if (body instanceof ArrayBuffer) {
                    dBody = Buffer.from(body);
                } else {
                    dBody = Buffer.from(JSON.stringify(body));
                }
            }

            console.log('Probot middleware received:', dHeaders, dBody.length);
            const mReqStream = Readable.from(dBody);
            const mReq = createRequest({
                url: '/hook',
                method: 'POST',
                headers: dHeaders,
                ...mReqStream
            });

            const mRes = createResponse({
                req: mReq,
                writableStream: Writable
            });

            console.log('Probot middleware request:', mReq.url, mReq.method, mReq.headers);
            (app as HExpress).handle(mReq, mRes, (...rest) => {
                console.log('Handle middleware finished:', rest);
            });
        } catch (error) {
            console.error('Probot middleware error:', error);
        }
    });
};