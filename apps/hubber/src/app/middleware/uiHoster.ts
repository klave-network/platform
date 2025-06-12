import { RequestHandler } from 'express-serve-static-core';
import { logger, objectStore, NoSuchBucket } from '@klave/providers';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { config } from '@klave/constants';

const DEFAULT_FILE = '/index.html';
let noHostingAlertDone = false;

export const uiHosterMiddleware: RequestHandler = (req, res, next) => {

    const domain = URL.parse(config.get('KLAVE_BHDUI_DOMAIN'));

    if (!domain?.host || domain.host.trim().length === 0) {
        if (!noHostingAlertDone) {
            noHostingAlertDone = true;
            logger.warn('KLAVE_BHDUI_DOMAIN is not set. Skipping UI hosting serving.');
        }
        return next();
    }

    const host = req.headers.host ?? '';
    const isAtKlave = host.endsWith(domain.host);

    if (!isAtKlave)
        return next();

    const deploymentId = host.split('.')[0];
    const requestedPath = req.forwardPath ?? req.path;
    let file = path.normalize(requestedPath.trim()).replace(/\\/g, '/');
    if (file.length === 0 || file === '/')
        file = DEFAULT_FILE;
    const objectKey = path.normalize(`${deploymentId}/${file}`).replace(/\\/g, '/');

    logger.debug(`Looking for ${file} from ${deploymentId}...`, {
        parent: 'dui'
    });

    objectStore.getObject({
        Bucket: config.get('KLAVE_BHDUI_S3_BUCKET_NAME'),
        Key: objectKey
    })
        .then(data => {
            if (!data.Body) {
                res.status(404).json({ ok: false, message: 'Not Found' });
                return;
            }
            if (data.ContentType)
                res.setHeader('Content-Type', data.ContentType);
            if (data.ETag)
                res.setHeader('ETag', data.ETag);
            if (data.LastModified)
                res.setHeader('Last-Modified', data.LastModified.toUTCString());
            if (data.ContentLength)
                res.setHeader('Content-Length', data.ContentLength.toString());

            const nodeReadableStream = Readable.fromWeb(data.Body.transformToWebStream() as ReadableStream);
            nodeReadableStream.on('error', (err) => {
                logger.error(`Error streaming object ${objectKey}: ${err}`);
                res.status(500).send('Internal Server Error');
            });
            nodeReadableStream.pipe(res);
        }).catch(err => {
            if (file !== DEFAULT_FILE && req.forwardPath === undefined) {
                req.forwardPath = DEFAULT_FILE;
                uiHosterMiddleware(req, res, next);
                return;
            }
            if (!(err instanceof NoSuchBucket))
                logger.debug(`Error retrieving object ${objectKey}: ${err}`);
            res.status(404).json({ ok: false, message: 'Not Found' });
        });
};
