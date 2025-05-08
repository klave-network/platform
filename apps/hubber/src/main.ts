// import { startPruner } from '@klave/pruner';
import { start } from './app';
import './i18n';
import { dbOps } from './utils/db';
import { sentryOps, scpOps, githubOps, envOps, dispatchOps, probotOps, objectStoreOps, logger } from '@klave/providers';
import http from 'node:http'
import https from 'node:https'

const onlineChain = async () => process.env['KLAVE_OFFLINE_DEV'] === 'true'
    ? Promise.resolve()
    : Promise.resolve()
        .then(dispatchOps.initialize)
        .then(scpOps.initialize)
        .then(githubOps.initialize);

logger.info(`Klave Hubber API v${process.env.GIT_REPO_VERSION}`);
logger.info(`Branch ${process.env.GIT_REPO_BRANCH} - ${process.env.GIT_REPO_COMMIT?.substring(0, 8)}${process.env.GIT_REPO_DIRTY ? '*' : ''}`);
logger.info(`Node ${process.version} - ${process.cwd()}`);

const serverHandle = dbOps.initialize()
    .then(envOps.initialize)
    .then(sentryOps.initialize)
    .then(probotOps.initialize)
    .then(objectStoreOps.initialize)
    .then(onlineChain)
    .then(async () => {

        const port = Number(process.env.PORT) || 3333;
        const host = process.env.HOST || 'klave.api.127.0.0.1.nip.io';
        const bhuiHostPort = Number(URL.parse(process.env['KLAVE_BHDUI_DOMAIN'] ?? '')?.port) || port;
        const bhuiHostDomain = URL.parse(process.env['KLAVE_BHDUI_DOMAIN'] ?? '')?.hostname || 'klave.api.127.0.0.2.nip.io';

        let protocol = 'http';
        const expressApp = await start();

        let serverContainer = http.createServer(expressApp);
        let serverContainerDUI = http.createServer(expressApp);
        if (process.env.NODE_ENV === 'development') {
            try {
                const viteMkcert = (await import('vite-plugin-mkcert')).default
                const vitePlugin = (viteMkcert({
                    keyFileName: 'klave-api-dev-key.pem',
                    certFileName: 'klave-api-dev-cert.pem',
                    hosts: [host, bhuiHostDomain, `*.${bhuiHostDomain}`]
                }) as any)
                if (vitePlugin && vitePlugin.config) {
                    const vitePluginConfig = await vitePlugin.config({
                        logLevel: 'silent'
                    })
                    serverContainer = https.createServer({
                        key: vitePluginConfig.server.https.key,
                        cert: vitePluginConfig.server.https.cert,
                    }, expressApp)
                    serverContainerDUI = https.createServer({
                        key: vitePluginConfig.server.https.key,
                        cert: vitePluginConfig.server.https.cert,
                    }, expressApp)
                    protocol = 'https'
                }
            } catch (error) {
                logger.warn('Error loading mkcert', error)
            }
        }

        const server = serverContainer
        const serverDUI = serverContainerDUI
        server.on('error', (error) => {
            logger.error(error);
            dbOps.stop()
                .catch(() => { return; });
        });
        serverDUI.on('error', (error) => {
            logger.error(error);
            dbOps.stop()
                .catch(() => { return; });
        });
        server.listen(port, host, () => {
            logger.info(`Listening at ${protocol}://${host}:${port}`);
        })
        serverContainerDUI.listen(bhuiHostPort, bhuiHostDomain, () => {
            logger.info(`Listening at ${protocol}://${bhuiHostDomain}:${bhuiHostPort}`);
        })

        // startPruner();

        return [server, serverDUI];

    }).catch(error => {
        logger.error(error);
    });

export default async () => await serverHandle;