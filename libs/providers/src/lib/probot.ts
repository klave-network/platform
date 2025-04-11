import { Probot } from 'probot';
import { logger } from './logger';

let probotReference: Probot | undefined;

export const probot = new Proxy<Probot>({} as Probot, {
    get: (__unusedTarget, prop, receiver) => {
        if (probotReference)
            return Reflect.get(probotReference, prop, receiver);
        if (prop === 'uninitialized')
            return true;
    }
});

export const probotOps = {
    initialize: async () => {

        const appId = process.env['KLAVE_PROBOT_APPID'];
        const privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${process.env['KLAVE_PROBOT_PRIVATE_KEY']}\n-----END RSA PRIVATE KEY-----`;
        const secret = process.env['KLAVE_PROBOT_WEBHOOK_SECRET'];

        if (!appId || appId.length === 0)
            throw new Error('Missing KLAVE_PROBOT_APPID environment variable');
        if (!privateKey || privateKey.length === 0)
            throw new Error('Missing KLAVE_PROBOT_PRIVATE_KEY environment variable');
        if (!secret || secret.length === 0)
            throw new Error('Missing KLAVE_PROBOT_WEBHOOK_SECRET environment variable');

        try {
            probotReference = new Probot({
                appId,
                privateKey,
                secret,
                logLevel: process.env['NODE_ENV'] === 'production' ? 'error' : 'debug'
            });

            const octokit = await probotReference.auth();
            await octokit.apps.listInstallations({
                per_page: 1
            });
            logger.info('Connected to GitHub via Probot');

        } catch (e) {
            logger.error(`Connection to GitHub via Probot failed: ${e}`);
        }
    }
};
