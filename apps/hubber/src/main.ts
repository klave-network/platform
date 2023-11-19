import { startPruner } from '@klave/pruner';
import { start } from './app';
import './i18n';
import { dbOps } from './utils/db';
import { scpOps, githubOps, envOps, dispatchOps, probotOps, logger } from '@klave/providers';

const onlineChain = async () => process.env['KLAVE_OFFLINE_DEV'] === 'true'
    ? Promise.resolve()
    : Promise.resolve()
        .then(dispatchOps.initialize)
        .then(scpOps.initialize)
        .then(githubOps.initialize);

logger.info(`Klave Hubber API v${process.env.GIT_REPO_VERSION}`);
logger.info(`Branch ${process.env.GIT_REPO_BRANCH} - ${process.env.GIT_REPO_COMMIT?.substring(0, 8)}${process.env.GIT_REPO_DIRTY ? '*' : ''}`);

dbOps.initialize()
    .then(envOps.initialize)
    .then(probotOps.initialize)
    .then(onlineChain)
    .then(async () => {

        const port = Number(process.env.PORT) || 3333;
        const host = process.env.HOST || '127.0.0.1';
        const server = (await start(port)).listen(port, host, () => {
            logger.info(`Listening at http://${host}:${port}`);
        }).on('error', function (err) {
            console.error(err);
        });

        server.on('error', (error) => {
            logger.error(error);
            dbOps.stop()
                .catch(() => { return; });
        });

        startPruner();

    }).catch(error => {
        logger.error(error);
    });