import { Probot } from 'probot';
import { logger } from './logger';

export const probot = new Probot({
    appId: process.env['KLAVE_PROBOT_APPID'],
    privateKey: `-----BEGIN RSA PRIVATE KEY-----\n${process.env['KLAVE_PROBOT_PRIVATE_KEY']}\n-----END RSA PRIVATE KEY-----`,
    secret: process.env['KLAVE_PROBOT_WEBHOOK_SECRET'],
    logLevel: process.env['NODE_ENV'] === 'production' ? 'error' : 'debug'
});

probot.load(() => {
    logger.info('Connected to GitHub via Probot');
});