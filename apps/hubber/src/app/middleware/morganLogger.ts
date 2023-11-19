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

export const morganLoggerMiddleware: RequestHandler = morgan(
    (tokens, req, res) => {
        return [
            tokens['remote-addr']?.(req, res) ?? '-',
            tokens.method?.(req, res) ?? '-',
            [tokens.url?.(req, res)].map(url => {
                let path = url?.split('?')?.[0];
                if (!path?.startsWith('/trpc/'))
                    return path;
                path = path.substring(6);
                const queryTree = path.split(',').map(f => f.split('.')).reduce((acc, parts) => {
                    let obj = acc;
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
                    if (obj[last])
                        obj[last].push(value);
                    else
                        obj[last] = [value];
                    return acc;
                }, {} as any);
                return `/trpc/${JSON.stringify(queryTree)}`;
            }),
            tokens.status?.(req, res) ?? '-',
            tokens.res?.(req, res, 'content-length'), '-',
            tokens['response-time']?.(req, res), 'ms'
        ].join(' ');
    },
    { stream, skip }
);
