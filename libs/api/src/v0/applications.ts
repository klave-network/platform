import { createTRPCRouter, publicProcedure } from '../trpc';
import { probot, scp, scpOps } from '@klave/providers';
import type { Application } from '@prisma/client';
import { z } from 'zod';
import { deployToSubstrate } from '../deployment/deploymentController';

export const applicationRouter = createTRPCRouter({
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, webId, session: { user } } }) => {
            const manifest = await prisma.application.findMany({
                where: {
                    webId
                },
                include: {
                    deployments: {
                        select: {
                            id: true,
                            set: true,
                            branch: true,
                            version: true,
                            build: true,
                            status: true,
                            released: true,
                            life: true,
                            sealed: true
                        }
                    },
                    permissionGrants: {
                        where: {
                            userId: user?.id
                        }
                    }
                }
            });
            return manifest;
        }),
    getByOrganisation: publicProcedure
        .input(z.object({
            orgId: z.string().uuid()
        }).or(z.object({
            orgSlug: z.string()
        })))
        .query(async ({ ctx: { prisma, session: { user } }, input }) => {

            const { orgId, orgSlug } = input as Record<string, string>;

            if ((orgId ?? '').trim() === '' && (orgSlug ?? '').trim() === '')
                return null;

            const apps = await prisma.application.findMany({
                where: {
                    organisation: {
                        OR: [{
                            id: orgId
                        },
                        {
                            slug: orgSlug
                        }]
                    },
                    permissionGrants: {
                        some: {
                            AND: [{
                                userId: user?.id
                            },
                            {
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }]
                        }
                    }
                },
                include: {
                    deployments: {
                        select: {
                            id: true,
                            set: true,
                            branch: true,
                            version: true,
                            build: true,
                            status: true,
                            released: true,
                            life: true,
                            sealed: true
                        }
                    },
                    permissionGrants: {
                        where: {
                            userId: user?.id
                        }
                    }
                }
            });

            // if (scpOps.isConnected()) {
            //     apps.forEach(async (app, idx) => {
            //         try {
            //             await scp.newTx('wasm-manager', 'get_kredit', `klave-app-get-kredit-${app.id}`, {
            //                 app_id: app.id
            //             }).send().then((result: any) => {
            //                 if (result.kredit === undefined)
            //                     throw (new Error('No credits returned'));
            //                 const ref = apps[idx];
            //                 if (ref)
            //                     ref.kredits = result.kredit;
            //                 return prisma.application.update({
            //                     where: {
            //                         id: app.id
            //                     },
            //                     data: {
            //                         kredits: result.kredit
            //                     }
            //                 });
            //             }).catch(() => {
            //                 // Swallow this error
            //             });
            //         } catch (e) {
            //             console.error(e);
            //             ///
            //         }
            //     });
            // }

            return apps;
        }),
    getById: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { appId } }) => {

            if (scpOps.isConnected()) {

                try {
                    await scp.newTx('wasm-manager', 'get_kredit', `klave-app-get-kredit-${appId}`, {
                        app_id: appId
                    }).send().then((result: any) => {
                        if (result.kredit === undefined)
                            throw (new Error('No credits returned'));
                        return prisma.application.update({
                            where: {
                                id: appId
                            },
                            data: {
                                kredits: result.kredit
                            }
                        });
                    }).catch(() => {
                        // Swallow this error
                    });
                } catch (e) {
                    console.error(e);
                    ///
                }

            }

            return await prisma.application.findUnique({
                where: {
                    id: appId,
                    permissionGrants: {
                        some: {
                            AND: [{
                                userId: user?.id
                            },
                            {
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }]
                        }
                    }
                },
                select: {
                    id: true,
                    catogories: true,
                    homepage: true,
                    description: true,
                    license: true,
                    webhook: true,
                    name: true,
                    tags: true,
                    repo: true,
                    kredits: true,
                    createdAt: true,
                    updatedAt: true,
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
    getBySlug: publicProcedure
        .input(z.object({
            appSlug: z.string(),
            orgSlug: z.string()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { appSlug, orgSlug } }) => {

            const org = await prisma.organisation.findUnique({
                where: {
                    slug: orgSlug
                }
            });

            if (!org)
                return null;

            const app = await prisma.application.findUnique({
                where: {
                    organisationId_slug: {
                        organisationId: org.id,
                        slug: appSlug
                    }
                }
            });

            if (!app)
                return null;

            if (scpOps.isConnected()) {

                try {
                    await scp.newTx('wasm-manager', 'get_kredit', `klave-app-get-kredit-${app.id}`, {
                        app_id: app.id
                    }).send().then((result: any) => {
                        if (result.kredit === undefined)
                            throw (new Error('No credits returned'));
                        return prisma.application.update({
                            where: {
                                id: app.id
                            },
                            data: {
                                kredits: result.kredit
                            }
                        });
                    }).catch(() => {
                        // Swallow this error
                    });
                } catch (e) {
                    console.error(e);
                    ///
                }

            }

            return await prisma.application.findUnique({
                where: {
                    id: app.id,
                    permissionGrants: {
                        some: {
                            AND: [{
                                userId: user?.id
                            },
                            {
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }]
                        }
                    }
                },
                select: {
                    id: true,
                    catogories: true,
                    homepage: true,
                    description: true,
                    license: true,
                    webhook: true,
                    name: true,
                    tags: true,
                    repo: true,
                    kredits: true,
                    createdAt: true,
                    updatedAt: true,
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
            emphemeralKlaveTag: z.string().optional(),
            organisationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore, sessionID, webId }, input: { deployableRepoId, applications, /*emphemeralKlaveTag,*/ organisationId } }) => {

            if (!session.user)
                return null;

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
                const appSlug = appName.replaceAll(/\W/g, '-').toLocaleLowerCase();
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
                await prisma.application.create({
                    data: {
                        web: {
                            connect: {
                                id: webId
                            }
                        },
                        name: appName,
                        slug: appSlug,
                        organisation: {
                            connect: {
                                id: organisationId
                            }
                        },
                        repo: {
                            connect: {
                                id: repo.id
                            }
                        },
                        catogories: [],
                        tags: [],
                        // author: webId ?? emphemeralKlaveTag ?? sessionID,
                        // owner: webId ?? emphemeralKlaveTag ?? sessionID,
                        permissionGrants: {
                            create: {
                                admin: true,
                                read: true,
                                write: true,
                                userId: session.user?.id ?? sessionID
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

                if (session.user === undefined)
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
        }).or(z.object({
            appSlug: z.string(),
            orgSlug: z.string(),
            data: z.custom<Partial<Application>>()
        })))
        .mutation(async ({ ctx: { prisma }, input }) => {

            const { appId, appSlug, orgSlug, data } = input as Record<string, any>;

            if (appId && data) {
                await prisma.application.update({
                    where: {
                        id: appId
                    },
                    data
                });
            }
            else if (appSlug && orgSlug && data) {
                const org = await prisma.organisation.findUnique({
                    where: {
                        slug: orgSlug
                    }
                });
                if (!org)
                    return null;
                await prisma.application.update({
                    where: {
                        organisationId_slug: {
                            slug: appSlug,
                            organisationId: org.id
                        }
                    },
                    data
                });
            }
            else
                throw (new Error('Invalid input'));
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
        }).or(z.object({
            applicationSlug: z.string(),
            organisationId: z.string()
        })))
        .mutation(async ({ ctx: { prisma }, input }) => {

            const { applicationId, applicationSlug, organisationId } = input as Record<string, string>;

            if (applicationId)
                await prisma.application.delete({
                    where: {
                        id: applicationId
                    }
                });
            else if (applicationSlug && organisationId)
                await prisma.application.delete({
                    where: {
                        organisationId_slug: {
                            slug: applicationSlug,
                            organisationId: organisationId
                        }
                    }
                });
            return;

        })
});

export default applicationRouter;