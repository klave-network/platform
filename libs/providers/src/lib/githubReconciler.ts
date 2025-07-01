import { trace } from '@sentry/core';
import * as Sentry from '@sentry/node';
import { prisma } from '@klave/db';
import { probot } from './probot';
import { logger } from './logger';

export const githubOps = {
    initialize: async () => {

        if (process.env.NODE_ENV === 'development') {
            logger.info('Skipping GitHub Sync in development mode');
            return;
        }

        console.log('Initializing GitHub Sync');
        return trace({
            name: 'BOOT GitHub Sync',
            op: 'boot.github',
            origin: 'manual.klave.github.init',
            description: 'Boot GitHub Sync'
        }, async (span) => {
            const octokit = await probot.auth();
            const installations = await octokit.paginate(
                octokit.rest.apps.listInstallations,
                {
                    per_page: 100
                },
                (response) => response.data
            );

            logger.info(`Found ${installations.length} Github App installations`);

            const queues = [];
            const chunkSize = Math.ceil(installations.length / 5);
            for (let i = 0; i < installations.length; i += chunkSize)
                queues.push(installations.slice(i, i + chunkSize));

            await Promise.allSettled(queues.map(async (installationsData, idx) =>
                Sentry.runWithAsyncContext(async () => trace({
                    name: `Queue ${idx}`,
                    description: `Queue ${idx}`,
                    parentSpanId: span?.spanId,
                    traceId: span?.traceId
                }, async () => {

                    for (const installation of installationsData) {
                        await prisma.installation.upsert({
                            where: {
                                source_remoteId_account: {
                                    source: 'github',
                                    remoteId: `${installation.id}`,
                                    account: installation.account?.name ?? 'unknown' // TODO - is this right?
                                }
                            },
                            create: {
                                source: 'github',
                                remoteId: `${installation.id}`,
                                account: installation.account?.name ?? 'unknown', // TODO - is this right?
                                accountType: 'unknown', // TODO - is this right?
                                hookPayload: installation
                            },
                            update: {
                                hookPayload: installation
                            }
                        });

                        const installationOctokit = await probot.auth(installation.id);
                        const repos = await installationOctokit.paginate(
                            installationOctokit.rest.apps.listReposAccessibleToInstallation,
                            {
                                per_page: 100
                            }
                        );

                        logger.info(`Syncing ${repos.length} repositories for installation ${installation.id}`);
                        for (const repo of repos) {
                            await prisma.repository.upsert({
                                where: {
                                    source_remoteId_installationRemoteId: {
                                        source: 'github',
                                        remoteId: `${repo.id}`,
                                        installationRemoteId: `${installation.id}`
                                    }
                                },
                                create: {
                                    source: 'github',
                                    remoteId: `${repo.id}`,
                                    installationRemoteId: `${installation.id}`,
                                    name: repo.name,
                                    owner: repo.owner.login,
                                    fullName: repo.full_name,
                                    defaultBranch: repo.default_branch,
                                    private: repo.private,
                                    installationPayload: repo
                                },
                                update: {
                                    name: repo.name,
                                    owner: repo.owner.login,
                                    fullName: repo.full_name,
                                    private: repo.private,
                                    installationPayload: repo
                                }
                            });
                        }
                    }
                }))));
        }, () => {
            logger.error('Failed to sync Github App installations');
        });
    }
};