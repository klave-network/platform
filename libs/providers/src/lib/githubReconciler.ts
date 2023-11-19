import { prisma } from '@klave/db';
import { probot } from './probot';
import { logger } from './logger';

export const githubOps = {
    initialize: async () => {
        const sync = async () => {
            const octokit = await probot.auth();
            const installationsData = await octokit.paginate(
                octokit.apps.listInstallations,
                {
                    per_page: 100
                },
                (response) => response.data
            );

            logger.info(`Found ${installationsData.length} Github App installations`);
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
                        hookPayload: installation as any
                    },
                    update: {
                        hookPayload: installation as any
                    }
                });

                const installationOctokit = await probot.auth(installation.id);
                const reposData = await installationOctokit.paginate(
                    installationOctokit.apps.listReposAccessibleToInstallation,
                    {
                        per_page: 100
                    }
                );

                const repos: typeof reposData['repositories'] = [];
                if (reposData.repositories)
                    repos.push(...reposData.repositories);
                if (Array.isArray(reposData))
                    repos.push(...reposData as any);

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
                            installationPayload: repo as any
                        },
                        update: {
                            name: repo.name,
                            owner: repo.owner.login,
                            fullName: repo.full_name,
                            private: repo.private,
                            installationPayload: repo as any
                        }
                    });
                }
            }
        };
        sync()
            .catch(() => {
                logger.error('Failed to sync Github App installations');
            });
    }
};