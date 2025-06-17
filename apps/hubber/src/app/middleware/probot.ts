import { Express, RequestHandler } from 'express-serve-static-core';
import { createNodeMiddleware, Probot } from 'probot';
import { probot, dispatchOps } from '@klave/providers';
import probotApp from '../probot';
import { createRequest, createResponse } from 'node-mocks-http';
import { Writable, Readable } from 'node:stream';

let middlewareReference: RequestHandler | undefined;
export const probotMiddleware: RequestHandler = (req, res, next) => {

    if (!middlewareReference && !(probot as Probot & { uninitialized?: boolean }).uninitialized) {
        middlewareReference = createNodeMiddleware(probotApp, {
            probot,
            webhooksPath: '/'
        }) as RequestHandler;
    }

    if (middlewareReference)
        middlewareReference(req, res, next);
    else
        next();
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

            (app as HExpress).handle(mReq, mRes, (...rest) => {
                console.log('Handle middleware finished:', rest);
            });
        } catch (error) {
            console.error('Probot middleware error:', error);
        }
    });
};