import { createTRPCRouter, publicProcedure } from '../trpc';
import { probot } from '@klave/providers';
import type { Application } from '@prisma/client';
import { z } from 'zod';
import { deployToSubstrate } from '../deployment/deploymentController';

export const applicationRouter = createTRPCRouter({
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, webId } }) => {
            const manifest = await prisma.application.findMany({
                where: {
                    webId
                },
                include: { deployments: true }
            });
            return manifest;
        }),
    getById: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, user }, input: { appId } }) => {
            return await prisma.application.findUnique({
                where: {
                    id: appId
                },
                select: {
                    catogories: true,
                    homepage: true,
                    description: true,
                    license: true,
                    webhook: true,
                    name: true,
                    tags: true,
                    repo: true,
                    permissionGrants: {
                        where: {
                            userId: user?.id
                        },
                        include: {
                            user: true,
                            organisation: true
                        }
                    }
                }
            });
        }),
    register: publicProcedure
        .input(z.object({
            deployableRepoId: z.string().uuid(),
            applications: z.array(z.string()),
            emphemeralKlaveTag: z.string().optional()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore, sessionID, user, webId }, input: { deployableRepoId, applications, emphemeralKlaveTag } }) => {

            const deployableRepo = await prisma.deployableRepo.findFirst({
                where: {
                    id: deployableRepoId
                }
            });

            if (!deployableRepo)
                throw (new Error('There is no such repo'));

            const newConfig = deployableRepo.config;
            if (newConfig === null)
                throw (new Error('There is no configuration repo'));

            applications.forEach(async appName => {
                // await prisma.$transaction(async (tx) => {
                // const repo = await tx.repo.upsert({
                const repo = await prisma.repo.upsert({
                    where: {
                        source_owner_name: {
                            source: 'github',
                            owner: deployableRepo.owner,
                            name: deployableRepo.name
                        }
                    },
                    update: {
                        // TODO: Use zod to validate the config
                        defaultBranch: deployableRepo.defaultBranch,
                        config: JSON.parse(newConfig) as any
                    },
                    create: {
                        source: 'github',
                        owner: deployableRepo.owner,
                        name: deployableRepo.name,
                        defaultBranch: deployableRepo.defaultBranch,
                        // TODO: Use zod to validate the config
                        config: JSON.parse(newConfig) as any
                    }
                });
                // /* const application = */ await tx.application.create({
                /* const application = */
                await prisma.application.create({
                    data: {
                        web: {
                            connect: {
                                id: webId
                            }
                        },
                        name: appName,
                        repo: {
                            connect: {
                                id: repo.id
                            }
                        },
                        catogories: [],
                        tags: [],
                        author: webId ?? emphemeralKlaveTag ?? sessionID,
                        owner: webId ?? emphemeralKlaveTag ?? sessionID,
                        permissionGrants: {
                            create: {
                                admin: true,
                                read: true,
                                write: true,
                                userId: webId ?? emphemeralKlaveTag ?? sessionID
                            }
                        }
                    }
                });

                const installationOctokit = await probot.auth(parseInt(deployableRepo.installationRemoteId));

                const lastCommits = await installationOctokit.repos.listCommits({
                    owner: deployableRepo.owner,
                    repo: deployableRepo.name,
                    per_page: 2
                });

                const [afterCommit] = lastCommits.data;

                if (afterCommit === undefined)
                    throw (new Error('There is no commit'));

                deployToSubstrate({
                    octokit: installationOctokit,
                    class: 'push',
                    type: 'push',
                    forceDeploy: true,
                    repo: {
                        url: afterCommit.html_url,
                        owner: deployableRepo.owner,
                        name: deployableRepo.name
                    },
                    commit: {
                        url: afterCommit.html_url,
                        ref: afterCommit.sha, // TODO: check if this is the right ref
                        after: afterCommit.sha
                    },
                    pusher: {
                        login: afterCommit.author?.login ?? afterCommit.committer?.login ?? afterCommit.commit.author?.name ?? 'unknown',
                        avatarUrl: afterCommit.author?.avatar_url ?? 'https://avatars.githubusercontent.com/u/583231?v=4',
                        htmlUrl: afterCommit.author?.html_url ?? afterCommit.committer?.html_url ?? ''
                    }
                });

                if (user === undefined)
                    await new Promise<void>((resolve, reject) => {
                        sessionStore.set(sessionID, {
                            ...session
                        }, (err) => {
                            if (err)
                                return reject(err);
                            return resolve();
                        });
                    });
            });

            return true;
        }),
    update: publicProcedure
        .input(z.object({
            appId: z.string().uuid(),
            data: z.custom<Partial<Application>>()
        }))
        .mutation(async ({ ctx: { prisma }, input: { appId, data } }) => {
            await prisma.application.update({
                where: {
                    id: appId
                },
                data
            });
            await prisma.activityLog.create({
                data: {
                    class: 'environment',
                    application: {
                        connect: {
                            id: appId
                        }
                    },
                    context: {
                        type: 'update',
                        payload: {}
                    }
                }
            });
            return true;
        }),
    delete: publicProcedure
        .input(z.object({
            applicationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma }, input: { applicationId } }) => {

            await prisma.application.delete({
                where: {
                    id: applicationId
                }
            });
            return;

        })
});

export default applicationRouter;