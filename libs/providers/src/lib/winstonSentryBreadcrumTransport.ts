import stripAnsi from 'strip-ansi';
import { addBreadcrumb, SeverityLevel } from '@sentry/node';
import TransportStream from 'winston-transport';


export class SentryBreadcrumb extends TransportStream {
    override log(info: any, next: () => void): any {

        const level = stripAnsi(info[Symbol.for('level')]);
        if (level === 'http')
            return next();

        const data = info[Symbol.for('splat')];

        addBreadcrumb({
            type: level === 'error' ? 'error' : 'debug',
            category: data?.[0]?.parent,
            data,
            message: stripAnsi(info.message),
            level: level as SeverityLevel,
            timestamp: info.timestamp ?? Date.now()
        });

        next();

    }
}
