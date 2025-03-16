import { trace } from '@sentry/core';
import { prisma, InstallationAccountType } from '@klave/db';
import type { Probot } from 'probot';
import type { components as OctokitComponents } from '@octokit/openapi-webhooks-types';
import { logger } from '@klave/providers';
import { deployToSubstrate } from '@klave/api';

function isUserAccount(account: unknown): account is OctokitComponents['schemas']['simple-user'] {
    if (!account || typeof account !== 'object')
        return false;
    return Object.hasOwn(account, 'login');
}

function isEnterpriseAccount(account: unknown): account is OctokitComponents['schemas']['enterprise'] {
    if (!account || typeof account !== 'object')
        return false;
    return Object.hasOwn(account, 'name');
}

const accountName = (account: unknown): string => {
    return isUserAccount(account) ? account.login : isEnterpriseAccount(account) ? account.name : '';
};

const accountType = (account: unknown): InstallationAccountType => {
    return isUserAccount(account) ? 'user' : isEnterpriseAccount(account) ? 'organization' : 'unknown';
};

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

        return await trace({
            name: 'HOOK Probot GitHub',
            op: 'hook.github',
            origin: 'manual.klave.github.hook',
            description: 'Probot GitHub Hook'

        }, async () => {

            try {
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
                        payload: context.payload as object
                    }
                });

                logger.info(`New record of hook '${context.name}' ${hook.id}`);

                if (context.name === 'installation') {
                    const { payload } = context;
                    const { account } = payload.installation;

                    if (!account) {
                        return;
                    }

                    if (payload.action === 'created') {
                        // TODO: Move this to the TRPC router
                        logger.info(`Registering new GithubApp installation ${payload.installation.id}`);

                        if (account.name)

                            await prisma.installation.upsert({
                                where: {
                                    source_remoteId_account: {
                                        source: 'github',
                                        remoteId: `${payload.installation.id}`,
                                        account: account.name ?? ''
                                    }
                                },
                                create: {
                                    source: 'github',
                                    remoteId: `${payload.installation.id}`,
                                    account: accountName(account),
                                    accountType: accountType(account),
                                    hookPayload: payload as object
                                },
                                update: {
                                    account: accountName(account),
                                    accountType: accountType(account),
                                    hookPayload: payload as object
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
                                        owner: accountName(account),
                                        fullName: repo.full_name,
                                        private: repo.private,
                                        installationPayload: repo
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
                                    account: accountName(account)
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
                    const { account } = payload.installation;

                    if (!account) {
                        return;
                    }

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
                                        owner: accountName(account),
                                        fullName: repo.full_name,
                                        private: repo.private,
                                        installationPayload: repo
                                    },
                                    update: {
                                        name: repo.name,
                                        owner: accountName(account),
                                        fullName: repo.full_name,
                                        private: repo.private,
                                        installationPayload: repo
                                    }
                                });
                                await prisma.deployableRepo.updateMany({
                                    where: {
                                        fullName: repo.full_name,
                                        owner: accountName(account)
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
                                    owner: accountName(account)
                                },
                                data: {
                                    installationRemoteId: ''
                                }
                            });
                        }
                    }
                }

                if (context.name === 'push') {

                    const { payload } = context;
                    const { sender, repository } = payload;
                    const { owner } = repository;

                    if (!sender || !owner) {
                        return;
                    }

                    deployToSubstrate({
                        octokit: context.octokit,
                        class: context.name,
                        type: context.name,
                        forceDeploy: false,
                        repo: {
                            url: payload.repository.html_url,
                            owner: owner.login,
                            name: payload.repository.name
                        },
                        commit: {
                            url: payload.repository.commits_url,
                            ref: payload.ref,
                            before: payload.before,
                            after: payload.after
                        },
                        headCommit: null,
                        pusher: {
                            login: sender.login,
                            avatarUrl: sender.avatar_url,
                            htmlUrl: sender.html_url
                        }
                    })
                        .catch(() => { return; });
                }

                if (context.name === 'repository') {

                    const { payload } = context;

                    await prisma.repo.updateMany({
                        where: {
                            source: 'github',
                            name: payload.repository.name,
                            owner: payload.repository.owner.login
                        },
                        data: {
                            defaultBranch: payload.repository.default_branch
                        }
                    });
                    await prisma.deployableRepo.updateMany({
                        where: {
                            fullName: payload.repository.full_name
                        },
                        data: {
                            defaultBranch: payload.repository.default_branch
                        }
                    });
                }
            } catch (e) {
                console.error(e?.toString());
                logger.error('Probot hook processing failed', { error: e });
            }
        }, () => {
            logger.error('Probot hook processing failed');
        });
    });
};

export default probotApp;