import { Octokit } from '@octokit/rest';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { objectToCamel } from 'ts-case-convert';
import type { GitHubToken, PrismaClient } from '@klave/db';
import { config, getFinalParseConfig } from '@klave/constants';
import { probotOps } from '@klave/providers';

export const reposRouter = createTRPCRouter({
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
                createdAt: new Date().toISOString()
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