import { readFileSync } from 'node:fs';
import { Probot } from 'probot';

export const probot = new Probot({
    appId: process.env['NX_PROBOT_APPID'],
    privateKey: process.env['NX_PROBOT_PRIVATE_KEYFILE'] ? readFileSync(process.env['NX_PROBOT_PRIVATE_KEYFILE']).toString() : undefined,
    secret: process.env['NX_PROBOT_WEBHOOK_SECRET'],
    logLevel: process.env['NODE_ENV'] === 'production' ? 'error' : 'debug'
});