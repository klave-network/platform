import stripAnsi from 'strip-ansi';
import { addBreadcrumb, SeverityLevel } from '@sentry/node';
import TransportStream from 'winston-transport';
import type { Logform } from 'winston';

export class SentryBreadcrumb extends TransportStream {
    override log(info: Logform.TransformableInfo, next: () => void) {

        const level = stripAnsi(`${info[Symbol.for('level')]}`);
        if (level === 'http')
            return next();

        const data = info[Symbol.for('splat')] as any;

        addBreadcrumb({
            type: level === 'error' ? 'error' : 'debug',
            category: data?.[0]?.parent,
            data,
            message: stripAnsi(`${info.message}`),
            level: level as SeverityLevel,
            timestamp: (info['timestamp'] as any) ?? Date.now()
        });

        next();

    }
}
