import { prisma } from '@klave/db';
import type { Probot } from 'probot';
import { logger } from '@klave/providers';
import { deployToSubstrate } from '@klave/api';

const probotApp = (app: Probot) => {
    app.on([
        'ping',
        'push',
        'pull_request',
        'repository',
        'check_run',
        'check_suite',
        'installation',
        'installation_repositories'
    ], async (context) => {

        const previousHook = await prisma.hook.findMany({
            where: {
                remoteId: context.id
            }
        });

        if (previousHook.length > 0) {
            logger.info(`Hook '${context.name}' ${context.id} already processed`);
            return;
        }

        // TODO Revisit this to use tRCP router with express context
        const hook = await prisma.hook.create({
            data: {
                source: 'github',
                event: context.name,
                remoteId: context.id,
                payload: context.payload as any
            }
        });
        logger.info(`New record of hook '${context.name}' ${hook.id}`);

        if (context.name === 'installation') {
            const { payload } = context;
            if (payload.action === 'created') {
                // TODO: Move this to the TRPC router
                logger.info(`Registering new GithubApp installation ${payload.installation.id}`);
                await prisma.installation.upsert({
                    where: {
                        source_remoteId_account: {
                            source: 'github',
                            remoteId: `${payload.installation.id}`,
                            account: payload.installation.account.login
                        }
                    },
                    create: {
                        source: 'github',
                        remoteId: `${payload.installation.id}`,
                        account: payload.installation.account.login,
                        accountType: payload.installation.account.type.toLowerCase() as any,
                        hookPayload: payload as any
                    },
                    update: {
                        account: payload.installation.account.login,
                        accountType: payload.installation.account.type.toLowerCase() as any,
                        hookPayload: payload as any
                    }
                });

                if (payload.repositories && payload.repositories.length > 0)
                    for (const repo of payload.repositories) {
                        await prisma.repository.create({
                            data: {
                                source: 'github',
                                remoteId: `${repo.id}`,
                                installationRemoteId: `${payload.installation.id}`,
                                name: repo.name,
                                owner: payload.installation.account.login,
                                fullName: repo.full_name,
                                private: repo.private,
                                installationPayload: repo as any
                            }
                        });
                    }
            }
            if (payload.action === 'deleted') {
                await prisma.installation.delete({
                    where: {
                        source_remoteId_account: {
                            source: 'github',
                            remoteId: `${payload.installation.id}`,
                            account: payload.installation.account.login
                        }
                    }
                });
                if (payload.repositories && payload.repositories.length > 0)
                    await prisma.repository.deleteMany({
                        where: {
                            source: 'github',
                            installationRemoteId: `${payload.installation.id}`,
                            remoteId: {
                                in: payload.repositories.map(r => `${r.id}`)
                            }
                        }
                    });
            }
        }

        if (context.name === 'installation_repositories') {
            const { payload } = context;
            if (payload.action === 'added') {
                // TODO: Move this to the TRPC router
                if (payload.repositories_added && payload.repositories_added.length > 0)
                    for (const repo of payload.repositories_added) {
                        await prisma.repository.upsert({
                            where: {
                                source_remoteId_installationRemoteId: {
                                    source: 'github',
                                    remoteId: `${repo.id}`,
                                    installationRemoteId: `${payload.installation.id}`
                                }
                            },
                            create: {
                                source: 'github',
                                remoteId: `${repo.id}`,
                                installationRemoteId: `${payload.installation.id}`,
                                name: repo.name,
                                owner: payload.installation.account.login,
                                fullName: repo.full_name,
                                private: repo.private,
                                installationPayload: repo as any
                            },
                            update: {
                                name: repo.name,
                                owner: payload.installation.account.login,
                                fullName: repo.full_name,
                                private: repo.private,
                                installationPayload: repo as any
                            }
                        });
                        await prisma.deployableRepo.updateMany({
                            where: {
                                fullName: repo.full_name,
                                owner: payload.installation.account.login
                            },
                            data: {
                                installationRemoteId: `${payload.installation.id}`
                            }
                        });
                    }
            }
            if (payload.action === 'removed') {
                if (payload.repositories_removed && payload.repositories_removed.length > 0) {
                    await prisma.repository.deleteMany({
                        where: {
                            source: 'github',
                            installationRemoteId: `${payload.installation.id}`,
                            remoteId: {
                                in: payload.repositories_removed.map(r => `${r.id}`)
                            }
                        }
                    });
                    await prisma.deployableRepo.updateMany({
                        where: {
                            fullName: {
                                in: payload.repositories_removed.map(r => r.full_name)
                            },
                            owner: payload.installation.account.login
                        },
                        data: {
                            installationRemoteId: ''
                        }
                    });
                }
            }
        }

        if (context.name === 'push')
            deployToSubstrate({
                octokit: context.octokit,
                class: context.name,
                type: context.name,
                forceDeploy: false,
                repo: {
                    url: context.payload.repository.html_url,
                    owner: context.payload.repository.owner.login,
                    name: context.payload.repository.name
                },
                commit: {
                    url: context.payload.repository.commits_url,
                    ref: context.payload.ref,
                    before: context.payload.before,
                    after: context.payload.after
                },
                pusher: {
                    login: context.payload.sender.login,
                    avatarUrl: context.payload.sender.avatar_url,
                    htmlUrl: context.payload.sender.html_url
                }
            });

        if (context.name === 'repository') {
            await prisma.repo.updateMany({
                where: {
                    source: 'github',
                    name: context.payload.repository.name,
                    owner: context.payload.repository.owner.login
                },
                data: {
                    defaultBranch: context.payload.repository.default_branch
                }
            });
            await prisma.deployableRepo.updateMany({
                where: {
                    fullName: context.payload.repository.full_name
                },
                data: {
                    defaultBranch: context.payload.repository.default_branch
                }
            });
        }
    });
};

export default probotApp;