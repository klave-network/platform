import { Octokit } from '@octokit/rest';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { objectToCamel } from 'ts-case-convert';
import { isTruthy } from '../utils/isTruthy';
import type { DeployableRepo, GitHubToken, PrismaClient } from '@klave/db';
import { config, getFinalParseConfig } from '@klave/constants';
import { probotOps } from '@klave/providers';

export const reposRouter = createTRPCRouter({
    deployables: publicProcedure
        .input(z.object({
            refreshing: z.boolean().default(false)
        }))
        .query(async ({ ctx: { session, sessionStore, sessionID, prisma }, input: { refreshing } }) => {

            let manifest: DeployableRepo[] = await prisma.deployableRepo.findMany({
                where: {
                    creatorAuthToken: session.githubToken?.accessToken
                }
            });

            if (manifest.length && !refreshing)
                return manifest.filter(repo => repo.config);

            if (!session.githubToken)
                throw new Error('Credentials refresh required');

            const { accessToken: lookupAccessToken } = session.githubToken;
            manifest = await prisma.deployableRepo.findMany({ where: { creatorAuthToken: lookupAccessToken } });

            if (manifest.length && !refreshing)
                return manifest.filter(repo => repo.config);

            const { refreshToken, expiresIn, createdAt } = session.githubToken;
            if (createdAt.valueOf() + expiresIn * 1000 < new Date().valueOf()) {
                try {

                    const result = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: config.get('KLAVE_GITHUB_CLIENTID'),
                            client_secret: config.get('KLAVE_GITHUB_CLIENTSECRET'),
                            grant_type: 'refreshToken',
                            refreshToken
                        })
                    });

                    const data = {
                        ...objectToCamel(await result.json() as object),
                        createdAt: Date.now()
                    } as unknown as GitHubToken & { error?: Error; errorDescription?: string; };

                    if (data.error) {
                        await new Promise<void>((resolve, reject) => {
                            session.githubToken = undefined;
                            sessionStore.set(sessionID, {
                                ...session,
                                githubToken: undefined
                            }, (err) => {
                                if (err)
                                    return reject(err);
                                return resolve();
                            });
                        });
                        throw {
                            refreshRequired: true
                        };
                    }
                    await new Promise<void>((resolve, reject) => {
                        session.githubToken = data;
                        sessionStore.set(sessionID, {
                            ...session,
                            githubToken: data
                        }, (err) => {
                            if (err)
                                return reject(err);
                            return resolve();
                        });
                    });
                } catch (e) {
                    if ((e as { refreshRequired: boolean }).refreshRequired)
                        throw new Error('Credentials refresh required');
                    console.error(e);
                }
            }

            const { accessToken } = session.githubToken;
            const octokit = new Octokit({ auth: accessToken });
            const reposData = await octokit.paginate(
                octokit.repos.listForAuthenticatedUser,
                {
                    per_page: 100
                },
                (response) => response.data.filter((r) => !r.archived)
            );

            await updateInstalledRepos(prisma, octokit);

            const repos = reposData.map(repo => ({
                creatorAuthToken: accessToken,
                owner: repo.owner.login,
                fullName: repo.full_name,
                name: repo.name,
                defaultBranch: repo.default_branch,
                installationRemoteId: ''
            })).filter(Boolean);

            const repositories = await prisma.repository.findMany({
                select: {
                    installationRemoteId: true,
                    fullName: true,
                    id: true
                },
                where: {
                    source: 'github',
                    fullName: {
                        in: repos.map(repo => repo.fullName)
                    }
                }
            });

            repos.forEach(repo => {
                const installationRemoteId = repositories.find(repositories => repositories.fullName === repo.fullName)?.installationRemoteId;
                if (installationRemoteId)
                    repo.installationRemoteId = installationRemoteId;
            });

            const [, , reposWithId] = await prisma.$transaction([
                prisma.deployableRepo.deleteMany({
                    where: {
                        OR: [{
                            creatorAuthToken: {
                                in: [accessToken, lookupAccessToken]
                            }
                        }, {
                            createdAt: {
                                lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
                            }
                        }]
                    }
                }),
                prisma.deployableRepo.createMany({
                    data: repos
                }),
                prisma.deployableRepo.findMany({ where: { creatorAuthToken: accessToken } })
            ]);

            const validRepos = await Promise.all(reposWithId.map(async repo => {
                try {
                    const handle = await octokit.repos.getContent({
                        owner: repo.owner,
                        repo: repo.name,
                        ref: repo.defaultBranch || undefined,
                        path: 'klave.json',
                        mediaType: {
                            format: 'raw+json'
                        }
                    });

                    const result = getFinalParseConfig(handle.data.toString());
                    repo.config = result.success ? JSON.stringify(result.data) : null;
                    await prisma.deployableRepo.update({ where: { id: repo.id }, data: { config: repo.config } });
                } catch (e) {
                    console.error(e?.toString());
                    return;
                }

                return repo;
            }));

            return validRepos.filter(repo => repo?.config).filter(isTruthy);
        }),
    getDeployableRepo: publicProcedure
        .input(z.object({
            owner: z.string(),
            name: z.string()
        }))
        .query(async ({ ctx: { session, prisma }, input: repoInfo }) => {

            const data = await prisma.deployableRepo.findFirst({
                where: {
                    creatorAuthToken: session.githubToken?.accessToken,
                    ...repoInfo
                }
            });

            if (!data)
                return null;

            const parsedConfig = getFinalParseConfig(data?.config);

            return {
                id: data.id,
                owner: data.owner,
                name: data.name,
                fullName: data.fullName,
                isAvailableToKlave: !!data.installationRemoteId && data.installationRemoteId.trim() !== '',
                config: parsedConfig?.success ? parsedConfig.data : null,
                configError: parsedConfig?.chainError ?? (!parsedConfig?.success ? parsedConfig?.error.flatten() : null)
            };
        }),
    registerGitHubCredentials: publicProcedure
        .input(z.object({
            code: z.string()
            // state: z.string()
        }))
        .query(async ({ ctx: { session, sessionStore, sessionID }, input: { code } }) => {
            const result = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: config.get('KLAVE_GITHUB_CLIENTID'),
                    client_secret: config.get('KLAVE_GITHUB_CLIENTSECRET'),
                    code
                })
            });

            const data = {
                ...objectToCamel(await result.json() as object),
                createdAt: new Date()
            } as unknown as GitHubToken & { error?: string; errorDescription?: string; };

            if (!data.error) {
                await new Promise<void>((resolve, reject) => {
                    session.githubToken = data;
                    sessionStore.set(sessionID, {
                        ...session,
                        githubToken: data
                    }, (err) => {
                        if (err)
                            return reject(err);
                        return resolve();
                    });
                });
            }
            return data;
        }),
    forking: publicProcedure
        .input(z.object({
            owner: z.string(),
            name: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore, sessionID }, input: { owner, name } }) => {

            if (!session.user)
                throw new Error('You must be logged in to do this');

            if (!session.githubToken)
                throw new Error('Credentials refresh required');

            try {
                const octokit = new Octokit({ auth: session.githubToken?.accessToken });
                const result = await octokit.repos.createFork({
                    owner,
                    repo: name
                });

                let kConfRetry = 0;
                await new Promise<void>((resolve, reject) => {
                    const waitForRepo = async () => {
                        try {
                            kConfRetry++;
                            if (kConfRetry > 10)
                                return reject();
                            await octokit.repos.getContent({
                                owner: result.data.owner.login,
                                repo: result.data.name,
                                ref: result.data.default_branch,
                                path: 'klave.json',
                                mediaType: {
                                    format: 'raw+json'
                                }
                            });
                            resolve();
                        } catch (e) {
                            console.error(e?.toString());
                            setTimeout(() => {
                                waitForRepo().catch(() => {
                                    // ;
                                });
                            }, 1000);
                        }
                    };
                    waitForRepo().catch(() => {
                        // ;
                    });
                });

                await updateInstalledRepos(prisma, octokit);

                const refInstalledRepo = await prisma.repository.findFirst({
                    select: {
                        installationRemoteId: true,
                        fullName: true,
                        id: true
                    },
                    where: {
                        source: 'github',
                        fullName: result.data.full_name
                    }
                });

                const handle = await octokit.repos.getContent({
                    owner: result.data.owner.login,
                    repo: result.data.name,
                    ref: result.data.default_branch,
                    path: 'klave.json',
                    mediaType: {
                        format: 'raw+json'
                    }
                });

                const parsedConfig = getFinalParseConfig(handle.data.toString());
                const config = parsedConfig.success ? JSON.stringify(parsedConfig.data) : null;

                const repo = {
                    creatorAuthToken: session.githubToken?.accessToken,
                    owner: result.data.owner.login,
                    fullName: result.data.full_name,
                    name: result.data.name,
                    defaultBranch: result.data.default_branch,
                    installationRemoteId: refInstalledRepo?.installationRemoteId ?? '',
                    config
                };

                await prisma.deployableRepo.upsert({
                    create: repo,
                    update: repo,
                    where: {
                        creatorAuthToken_owner_name: {
                            creatorAuthToken: session.githubToken?.accessToken,
                            owner: result.data.owner.login,
                            name: result.data.name
                        }
                    }
                });

                return repo;
            } catch (e) {
                await new Promise<void>((resolve, reject) => {
                    session.githubToken = undefined;
                    sessionStore.set(sessionID, {
                        ...session,
                        githubToken: undefined
                    }, (err) => {
                        if (err)
                            return reject(err);
                        return resolve();
                    });
                });

                console.error(e?.toString());
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error(`There was an error forking the repository: ${(e as any).message}`);
            }

        })
});

const updateInstalledRepos = async (prisma: PrismaClient, octokit: Octokit) => {

    const probot = probotOps.getProbot();

    if (!probot) {
        throw new Error('Probot is not initialized');
    }

    const allRepos = [];
    const currentInstallForRepo = await octokit.apps.listInstallationsForAuthenticatedUser({
        per_page: 100
    });

    const installationsData = currentInstallForRepo.data.installations;

    for (const installation of installationsData) {
        await prisma.installation.upsert({
            where: {
                source_remoteId_account: {
                    source: 'github',
                    remoteId: `${installation.id}`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    account: installation.account?.name ?? (installation.account as any)?.login ?? 'unknown' // TODO - is this right?
                }
            },
            create: {
                source: 'github',
                remoteId: `${installation.id}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                account: installation.account?.name ?? (installation.account as any)?.login ?? 'unknown', // TODO - is this right?
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
        allRepos.push(...repos);
    }
    return allRepos;
};

export default reposRouter;