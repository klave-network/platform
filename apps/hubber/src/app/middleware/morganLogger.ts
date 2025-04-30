import { RequestHandler } from 'express-serve-static-core';
import morgan, { StreamOptions } from 'morgan';
import { logger } from '@klave/providers';

const stream: StreamOptions = {
    // Use the http severity
    write: (message) => logger.http(message.trim())
};

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

let totalPingCount = 0;

export const morganLoggerMiddleware: RequestHandler = morgan(
    (tokens, req, res) => {
        if ((tokens.url?.(req, res)?.startsWith('/ping') || tokens.url?.(req, res)?.startsWith('/version')) && req.headers['x-kube-probe'] !== undefined) {
            totalPingCount++;
            if (totalPingCount % 1000 === 0)
                return `The runtime probe has pinged ${totalPingCount} times...`;
            else
                return null;
        }
        return [
            tokens['remote-addr']?.(req, res) ?? '-',
            tokens.method?.(req, res) ?? '-',
            [tokens.url?.(req, res)].map(url => {
                let path = url?.split('?')?.[0];
                if (!path?.startsWith('/trpc/'))
                    return path;
                path = path.substring(6);
                const queryTree = path.split(',').map(f => f.split('.')).reduce<unknown>((acc, parts) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = acc;
                    let part: string | undefined;
                    const value = parts.pop();
                    const last = parts.pop();
                    if (!last)
                        return acc;
                    while ((part = parts.shift())) {
                        if (typeof obj[part] !== 'object')
                            obj[part] = {};
                        obj = obj[part];
                    }
                    if (!value)
                        return acc;
                    if (obj[last])
                        obj[last].push(value);
                    else
                        obj[last] = [value];
                    return acc;
                }, {});
                return `/trpc/${JSON.stringify(queryTree)}`;
            }),
            tokens.status?.(req, res) ?? '-',
            tokens.res?.(req, res, 'content-length'), '-',
            tokens['response-time']?.(req, res), 'ms'
        ].join(' ');
    },
    { stream, skip }
);
