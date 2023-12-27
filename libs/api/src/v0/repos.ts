// import { CipherGCM } from 'node:crypto';
import { Octokit } from '@octokit/rest';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { objectToCamel } from 'ts-case-convert';
import { isTruthy } from '../utils/isTruthy';
import type { DeployableRepo, GitHubToken } from '@klave/db';
import { getFinalParseConfig } from '@klave/constants';

export const reposRouter = createTRPCRouter({
    deployables: publicProcedure
        .input(z.object({
            refreshing: z.boolean().default(false)
        }))
        .query(async ({ ctx: { session, sessionStore, sessionID, prisma, web }, input: { refreshing } }) => {

            let manifest: DeployableRepo[] = await prisma.deployableRepo.findMany({
                where: {
                    OR: [{
                        webId: web.id
                    }, {
                        creatorAuthToken: web.githubToken?.accessToken
                    }]
                }
            });

            if (manifest.length && !refreshing)
                return manifest.filter(repo => repo.config);

            if (!web.githubToken) {
                await prisma.web.update({
                    where: {
                        id: web.id
                    },
                    data: {
                        githubToken: null
                    }
                });
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
                throw new Error('Credentials refresh required');
            }

            const { accessToken: lookupAccessToken } = web.githubToken;
            manifest = await prisma.deployableRepo.findMany({ where: { creatorAuthToken: lookupAccessToken } });

            if (manifest.length && !refreshing)
                return manifest.filter(repo => repo.config);

            const { refreshToken, expiresIn, createdAt } = web.githubToken;
            if (createdAt.valueOf() + expiresIn * 1000 < new Date().valueOf()) {
                try {

                    const result = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: process.env['KLAVE_GITHUB_CLIENTID'],
                            client_secret: process.env['KLAVE_GITHUB_CLIENTSECRET'],
                            grant_type: 'refreshToken',
                            refreshToken
                        })
                    });
                    const data = {
                        ...objectToCamel(await result.json() as object),
                        createdAt: Date.now()
                    } as unknown as GitHubToken & { error?: Error; errorDescription?: string; };

                    if (data.error) {
                        await prisma.web.update({
                            where: {
                                id: web.id
                            },
                            data: {
                                githubToken: null
                            }
                        });
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

            const { accessToken } = web.githubToken;
            const octokit = new Octokit({ auth: accessToken });
            const reposData = await octokit.paginate(
                octokit.repos.listForAuthenticatedUser,
                {
                    per_page: 100
                },
                (response) => response.data.filter((r) => !r.archived)
            );

            const repos = reposData.map(repo => ({
                webId: web.id,
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
                            webId: web.id
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
                        path: 'klave.json',
                        mediaType: {
                            format: 'raw+json'
                        }
                    });

                    const result = getFinalParseConfig(handle.data.toString());
                    repo.config = result.success ? JSON.stringify(result.data) : null;
                    await prisma.deployableRepo.update({ where: { id: repo.id }, data: { config: repo.config } });
                } catch (e) {
                    // return [];
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
        .query(async ({ ctx: { webId, prisma }, input: repoInfo }) => {

            const data = await prisma.deployableRepo.findFirst({
                where: {
                    webId,
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
        .query(async ({ ctx: { session, sessionStore, sessionID, prisma, webId }, input: { code } }) => {

            // const secret = '1000060000000000';

            // const cipher = crypto.createCipher('aes-128-ecb', secret);

            // const ciphertext = cipher.update('9', 'utf8', 'base64') + cipher.final('base64');


            const result = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: process.env['KLAVE_GITHUB_CLIENTID'],
                    client_secret: process.env['KLAVE_GITHUB_CLIENTSECRET'],
                    code
                })
            });

            const data = {
                ...objectToCamel(await result.json() as object),
                createdAt: new Date()
            } as unknown as GitHubToken & { error?: string; errorDescription?: string; };

            if (!data.error) {
                await prisma.web.update({
                    where: { id: webId },
                    data: { githubToken: data }
                });
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
        })
});

export default reposRouter;