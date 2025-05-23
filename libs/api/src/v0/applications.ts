import { createTRPCRouter, publicProcedure } from '../trpc';
import * as Sentry from '@sentry/node';
import { logger, probot, scp, scpOps } from '@klave/providers';
import type { Application, Limits } from '@klave/db';
import { z } from 'zod';
import { deployToSubstrate } from '../deployment/deploymentController';
import { config, getFinalParseConfig, KlaveGetCreditResult } from '@klave/constants';

export const applicationRouter = createTRPCRouter({
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, webId, session: { user } } }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const manifest = await prisma.application.findMany({
                where: {
                    webId,
                    deletedAt: {
                        isSet: false
                    }
                },
                include: {
                    deployments: {
                        where: {
                            deletedAt: {
                                isSet: false
                            }
                        },
                        select: {
                            id: true,
                            set: true,
                            branch: true,
                            version: true,
                            build: true,
                            status: true,
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

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const { orgId, orgSlug } = input as Record<string, string>;

            if ((orgId ?? '').trim() === '' && (orgSlug ?? '').trim() === '')
                return null;

            const apps = await prisma.application.findMany({
                where: {
                    deletedAt: {
                        isSet: false
                    },
                    organisation: {
                        OR: [{
                            id: orgId
                        },
                        {
                            slug: orgSlug
                        }]
                    },
                    OR: [{
                        organisation: {
                            permissionGrants: {
                                some: {
                                    userId: user?.id
                                    , OR: [{
                                        read: true
                                    },
                                    {
                                        write: true
                                    },
                                    {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }
                        }
                    }]
                },
                include: {
                    deployments: {
                        where: {
                            deletedAt: {
                                isSet: false
                            }
                        },
                        select: {
                            id: true,
                            set: true,
                            branch: true,
                            version: true,
                            build: true,
                            status: true,
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
            //             await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit', `klave-app-get-kredit-${app.id}`, {
            //                 app_id: app.id
            //             }).send().then((result) => {
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
            //             await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_query', `klave-app-get-query-limit-${appId}`, {
            //                 app_id: appId
            //             }).send()
            //                 .then(async (result) => {
            //                     if (result.kredit === undefined)
            //                         throw (new Error('No credits returned'));
            //                     return prisma.application.update({
            //                         where: {
            //                             id: appId
            //                         },
            //                         data: {
            //                             limits: {
            //                                 queryCallSpend: result.kredit ?? 0
            //                             }
            //                         }
            //                     });
            //                 }).catch(() => {
            //                     // Swallow this error
            //                 });
            //                     } catch (e) {
            //                         console.error(e);
            //                         ///
            //                     }
            //                 });
            //             }
            //             await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_transaction', `klave-app-get-transaction-limit-${appId}`, {
            //                 app_id: appId
            //             }).send()
            //                 .then(async (result) => {
            //                     if (result.kredit === undefined)
            //                         throw (new Error('No credits returned'));
            //                     return prisma.application.update({
            //                         where: {
            //                             id: appId
            //                         },
            //                         data: {
            //                             limits: {
            //                                 transactionCallSpend: result.kredit ?? 0
            //                             }
            //                         }
            //                     });
            //                 }).catch(() => {
            //                     // Swallow this error
            //                 });
            //                     } catch (e) {
            //                         console.error(e);
            //                         ///
            //                     }
            //                 });
            //             }

            return apps;
        }),
    getById: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { appId } }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            if (scpOps.isConnected()) {

                await Sentry.startSpan({
                    name: 'SCP Subtask',
                    op: 'scp.task',
                    description: 'Secretarium Task'
                }, async () => {
                    try {
                        // await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit', `klave-app-get-kredit-${appId}`, {
                        //     app_id: appId
                        // }).send()
                        //     .then(async (result) => {
                        //         if (result.kredit === undefined)
                        //             throw (new Error('No credits returned'));
                        //         return prisma.application.update({
                        //             where: {
                        //                 id: appId
                        //             },
                        //             data: {
                        //                 kredits: result.kredit
                        //             }
                        //         });
                        //     }).catch(() => {
                        //         // Swallow this error
                        //     });
                        await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_query', `klave-app-get-query-limit-${appId}`, {
                            app_id: appId
                        }).send()
                            .then(async (result) => {
                                if (result.kredit === undefined)
                                    throw (new Error('No credits returned'));
                                return await prisma.application.update({
                                    where: {
                                        id: appId
                                    },
                                    data: {
                                        limits: {
                                            queryCallSpend: result.kredit ?? 0
                                        }
                                    }
                                });
                            }).catch(() => {
                                // Swallow this error
                            });
                        await scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_transaction', `klave-app-get-transaction-limit-${appId}`, {
                            app_id: appId
                        }).send()
                            .then(async (result) => {
                                if (result.kredit === undefined)
                                    throw (new Error('No credits returned'));
                                return await prisma.application.update({
                                    where: {
                                        id: appId
                                    },
                                    data: {
                                        limits: {
                                            transactionCallSpend: result.kredit ?? 0
                                        }
                                    }
                                });
                            }).catch(() => {
                                // Swallow this error
                            });
                    } catch (e) {
                        console.error(e?.toString());
                        ///
                    }
                });
            }

            return await prisma.application.findUnique({
                where: {
                    id: appId,
                    OR: [{
                        organisation: {
                            permissionGrants: {
                                some: {
                                    userId: user?.id
                                    , OR: [{
                                        read: true
                                    },
                                    {
                                        write: true
                                    },
                                    {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }
                        }
                    }]
                },
                select: {
                    id: true,
                    slug: true,
                    catogories: true,
                    homepage: true,
                    description: true,
                    license: true,
                    webhook: true,
                    limits: true,
                    gitSignRequired: true,
                    deployCommitLedgers: true,
                    tags: true,
                    repo: true,
                    kredits: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
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

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const org = await prisma.organisation.findUnique({
                where: {
                    slug: orgSlug
                }
            });

            if (!org)
                return null;

            const app = await prisma.application.findFirst({
                where: {
                    deletedAt: {
                        isSet: false
                    },
                    slug: appSlug,
                    organisationId: org.id
                }
            });

            if (!app)
                return null;

            if (scpOps.isConnected()) {

                await Sentry.startSpan({
                    name: 'SCP Subtask',
                    op: 'scp.task',
                    description: 'Secretarium Task'
                }, async () => {

                    const newLimits = { ...(app.limits ?? {}) };
                    try {
                        // await scp.newTx<KlaveGetCreditResult>(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit', `klave-app-get-kredit-${app.id}`, {
                        //     app_id: app.id
                        // }).send().then(async (result) => {
                        //     if (result.kredit === undefined)
                        //         throw (new Error('No credits returned'));
                        //     return prisma.application.update({
                        //         where: {
                        //             id: app.id
                        //         },
                        //         data: {
                        //             kredits: result.kredit
                        //         }
                        //     });
                        // }).catch(() => {
                        //     // Swallow this error
                        // });
                        await scp.newTx<KlaveGetCreditResult>(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_query', `klave-app-get-query-limit-${app.id}`, {
                            app_id: app.id
                        }).send()
                            .then(async (result) => {
                                if (result.kredit === undefined)
                                    throw (new Error('No credits returned'));
                                newLimits.queryCallSpend = result.kredit ?? 0;
                            }).catch(() => {
                                // Swallow this error
                            });
                        await scp.newTx<KlaveGetCreditResult>(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_allowed_kredit_per_transaction', `klave-app-get-transaction-limit-${app.id}`, {
                            app_id: app.id
                        }).send()
                            .then(async (result) => {
                                if (result.kredit === undefined)
                                    throw (new Error('No credits returned'));
                                newLimits.transactionCallSpend = result.kredit ?? 0;
                            }).catch(() => {
                                // Swallow this error
                            });
                        await prisma.application.update({
                            where: {
                                id: app.id
                            },
                            data: {
                                limits: newLimits
                            }
                        });
                    } catch (e) {
                        console.error(e?.toString());
                        ///
                    }
                });

            }

            return await prisma.application.findUnique({
                where: {
                    deletedAt: {
                        isSet: false
                    },
                    id: app.id,
                    OR: [{
                        organisation: {
                            permissionGrants: {
                                some: {
                                    userId: user?.id
                                    , OR: [{
                                        read: true
                                    },
                                    {
                                        write: true
                                    },
                                    {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }
                        }
                    }]
                },
                select: {
                    id: true,
                    slug: true,
                    catogories: true,
                    homepage: true,
                    description: true,
                    license: true,
                    webhook: true,
                    limits: true,
                    gitSignRequired: true,
                    deployCommitLedgers: true,
                    tags: true,
                    repo: true,
                    kredits: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
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
    infiniteApplications: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish()
            })
        )
        .query(async ({ ctx: { session, prisma }, input }) => {

            if (!session.user?.globalAdmin) {
                throw new Error('Not authenticated');
            }

            const applicationCount = await prisma.application.count();
            const { cursor } = input;
            const limit = input.limit ?? 50;
            const applications = await prisma.application.findMany({
                take: limit + 1, // get an extra item at the end which we'll use as next cursor
                cursor: cursor ? {
                    id: cursor
                } : undefined,
                orderBy: {
                    id: 'asc'
                },
                where: {
                    deletedAt: {
                        isSet: false
                    }
                },
                include: {
                    organisation: true,
                    deployments: true
                }
            });
            let nextCursor: typeof cursor | undefined = undefined;
            if (applications.length > limit) {
                const nextItem = applications.pop();
                nextCursor = nextItem?.id;
            }
            return {
                data: applications,
                meta: {
                    totalRowCount: applicationCount
                },
                nextCursor
            };
        }),
    canRegister: publicProcedure
        .input(z.object({
            applications: z.array(z.string()),
            organisationId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session }, input: { applications, organisationId } }) => {

            if (!session.user)
                throw (new Error('You must be logged in'));

            return (await Promise.all(applications.map(async appName => {
                const appSlug = appName.replaceAll(/\W/g, '-').toLocaleLowerCase();
                return [appName, await (async () => {
                    const existingApp = await prisma.application.findFirst({
                        where: {
                            deletedAt: {
                                isSet: false
                            },
                            organisationId,
                            slug: appSlug
                        }
                    });
                    return !existingApp;
                })()
                    .catch((error) => { throw error; })
                ];
            })) as Array<[string, boolean]>).reduce((acc, [appName, canRegister]) => {
                acc[appName] = canRegister;
                return acc;
            }, {} as Record<string, boolean>);
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
                throw (new Error('You must be logged in to register an application'));

            const deployableRepo = await prisma.deployableRepo.findFirst({
                where: {
                    id: deployableRepoId
                }
            });

            if (!deployableRepo)
                throw (new Error('There is no such repo'));

            const newParsedConfig = getFinalParseConfig(deployableRepo.config);
            const newConfig = newParsedConfig.success ? newParsedConfig.data : null;

            if (newConfig === null)
                throw (new Error('There is no configuration in this repo'));

            applications.forEach(appName => {
                (async () => {
                    const appSlug = appName.replaceAll(/\W/g, '-').toLocaleLowerCase();
                    const existingApp = await prisma.application.findFirst({
                        where: {
                            deletedAt: {
                                isSet: false
                            },
                            organisationId,
                            slug: appSlug
                        }
                    });

                    if (existingApp)
                        throw (new Error(`There is already an application named ${appSlug}`));
                })()
                    .catch((error) => { throw error; });
            });

            applications.forEach(appName => {
                (async () => {
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
                            config: newConfig
                        },
                        create: {
                            source: 'github',
                            owner: deployableRepo.owner,
                            name: deployableRepo.name,
                            defaultBranch: deployableRepo.defaultBranch,
                            // TODO: Use zod to validate the config
                            config: newConfig
                        }
                    });
                    const newApp = await prisma.application.create({
                        data: {
                            web: {
                                connect: {
                                    id: webId
                                }
                            },
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
                            limits: {
                                queryCallSpend: 0,
                                transactionCallSpend: 0
                            },
                            catogories: [],
                            tags: []
                            // author: webId ?? emphemeralKlaveTag ?? sessionID,
                            // owner: webId ?? emphemeralKlaveTag ?? sessionID lklk
                        }
                    });

                    logger.debug(`Registering application ${appSlug} (${newApp.id})`);

                    const installationOctokit = await probot.auth(parseInt(deployableRepo.installationRemoteId));

                    const lastCommits = await installationOctokit.repos.listCommits({
                        owner: deployableRepo.owner,
                        repo: deployableRepo.name,
                        per_page: 2
                    });

                    const [afterCommit] = lastCommits.data;

                    if (afterCommit === undefined)
                        throw (new Error('There is no commit'));

                    await deployToSubstrate({
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
                        headCommit: null,
                        pusher: {
                            login: afterCommit.author?.login ?? afterCommit.committer?.login ?? afterCommit.commit.author?.name ?? 'unknown',
                            avatarUrl: afterCommit.author?.avatar_url ?? 'https://avatars.githubusercontent.com/u/583231?v=4',
                            htmlUrl: afterCommit.author?.html_url ?? afterCommit.committer?.html_url ?? ''
                        }
                    }, {
                        onlyApp: newApp.id
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
                })()
                    .catch(() => { return; });
            });

            return true;
        }),
    update: publicProcedure
        .input(z.object({
            data: z.custom<Partial<Application>>()
        }).and(z.discriminatedUnion('withSlug', [z.object({
            withSlug: z.literal(false),
            appId: z.string().uuid()
        }), z.object({
            withSlug: z.literal(true),
            appSlug: z.string(),
            orgSlug: z.string()
        })])))
        .mutation(async ({ ctx: { prisma, session: { user } }, input }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            if (input.withSlug) {
                const { appSlug, orgSlug, data } = input;
                const org = await prisma.organisation.findUnique({
                    where: {
                        slug: orgSlug
                    }
                });

                if (!org)
                    return null;

                const app = await prisma.application.findFirst({
                    where: {
                        deletedAt: {
                            isSet: false
                        },
                        slug: appSlug,
                        organisationId: org.id
                    }
                });

                if (!app)
                    return null;

                await prisma.application.update({
                    where: {
                        id: app.id
                    },
                    data
                });

                await prisma.activityLog.create({
                    data: {
                        class: 'environment',
                        application: {
                            connect: {
                                id: app.id
                            }
                        },
                        context: {
                            type: 'update',
                            payload: {}
                        }
                    }
                });
            } else {
                const { appId, data } = input;
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
            }

            return true;
        }),
    delete: publicProcedure
        .input(z.object({
            applicationId: z.string().uuid()
        }).or(z.object({
            applicationSlug: z.string(),
            organisationId: z.string()
        })))
        .mutation(async ({ ctx: { prisma, session: { user } }, input }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const { applicationId, applicationSlug, organisationId } = input as Record<string, string>;
            let app: Application | null = null;

            if (applicationId)
                app = await prisma.application.findFirst({
                    where: {
                        id: applicationId
                    }
                });
            else if (applicationSlug && organisationId)
                app = await prisma.application.findFirst({
                    where: {
                        deletedAt: {
                            isSet: false
                        },
                        slug: applicationSlug,
                        organisationId: organisationId
                    }
                });

            if (!app)
                throw (new Error('No application found'));

            await prisma.$transaction([
                prisma.organisation.update({
                    where: {
                        id: app.organisationId
                    },
                    data: {
                        kredits: {
                            increment: app.kredits
                        }
                    }
                }),
                prisma.application.update({
                    where: {
                        id: app.id
                    },
                    data: {
                        deletedAt: new Date()
                    }
                })
            ]);
        }),
    setLimits: publicProcedure
        .input(z.object({
            limits: z.custom<Partial<Limits>>()
        }).and(z.discriminatedUnion('withSlug', [z.object({
            withSlug: z.literal(false),
            applicationId: z.string().uuid()
        }), z.object({
            withSlug: z.literal(true),
            applicationSlug: z.string(),
            organisationId: z.string()
        })])))
        .mutation(async ({ ctx: { prisma, session: { user } }, input }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            let app: Application | null = null;

            if (input.withSlug) {
                const { applicationSlug, organisationId } = input;
                app = await prisma.application.findFirst({
                    where: {
                        deletedAt: {
                            isSet: false
                        },
                        slug: applicationSlug,
                        organisationId: organisationId,
                        OR: [{
                            organisation: {
                                permissionGrants: {
                                    some: {
                                        userId: user?.id,
                                        OR: [
                                            {
                                                write: true
                                            },
                                            {
                                                admin: true
                                            }]
                                    }
                                }
                            }
                        }, {
                            permissionGrants: {
                                some: {
                                    userId: user?.id,
                                    OR: [
                                        {
                                            write: true
                                        },
                                        {
                                            admin: true
                                        }]
                                }
                            }
                        }]
                    }
                });
            } else {
                const { applicationId } = input;
                app = await prisma.application.findFirst({
                    where: {
                        id: applicationId,
                        OR: [{
                            organisation: {
                                permissionGrants: {
                                    some: {
                                        userId: user?.id,
                                        OR: [
                                            {
                                                write: true
                                            },
                                            {
                                                admin: true
                                            }]
                                    }
                                }
                            }
                        }, {
                            permissionGrants: {
                                some: {
                                    userId: user?.id,
                                    OR: [
                                        {
                                            write: true
                                        },
                                        {
                                            admin: true
                                        }]
                                }
                            }
                        }]
                    }
                });
            }

            if (!app)
                throw (new Error('No application found'));

            const limits = Object.fromEntries(Object.entries(input.limits).filter(([_u, v]) => v !== undefined));
            const combinedLimits = {
                ...app.limits,
                ...limits
            };

            await prisma.application.update({
                where: {
                    id: app.id
                },
                data: {
                    limits: combinedLimits
                }
            });

            await Sentry.startSpan({
                name: 'SCP Subtask',
                op: 'scp.task.kredit.transaction.allow',
                description: 'Secretarium Task Transaction Kredit Allocation'
            }, async () => {
                return await new Promise((resolve, reject) => {

                    scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'set_allowed_kredit_per_transaction', `klave-app-set-transaction-limit-${app.id}`, {
                        app_id: app.id,
                        kredit: Number(combinedLimits.transactionCallSpend)
                    }).onExecuted(result => {
                        resolve(result);
                    }).onError(error => {
                        reject(error);
                    }).send()
                        .catch(reject);
                });
            });

            await Sentry.startSpan({
                name: 'SCP Subtask',
                op: 'scp.task.kredit.query.allow',
                description: 'Secretarium Task Query Kredit Allocation'
            }, async () => {
                return await new Promise((resolve, reject) => {

                    scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'set_allowed_kredit_per_query', `klave-app-set-query-limit-${app.id}`, {
                        app_id: app.id,
                        kredit: Number(combinedLimits.queryCallSpend)
                    }).onExecuted(result => {
                        resolve(result);
                    }).onError(error => {
                        reject(error);
                    }).send()
                        .catch(reject);
                });
            });
        }),
    infiniteUsage: publicProcedure
        .input(
            z.object({
                appSlug: z.string(),
                orgSlug: z.string(),
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.number().nullish() // <-- "cursor" needs to exist, but can be any type
            })
        )
        .query(async ({ ctx: { session: { user }, prisma }, input }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const org = await prisma.organisation.findUnique({
                where: {
                    slug: input.orgSlug,
                    permissionGrants: {
                        some: {
                            userId: user?.id,
                            OR: [{
                                read: true
                            },
                            {
                                write: true
                            },
                            {
                                admin: true
                            }]
                        }
                    }
                }
            });

            if (!org)
                throw (new Error('No usage found'));

            const app = await prisma.application.findFirst({
                where: {
                    deletedAt: {
                        isSet: false
                    },
                    organisationId: org.id,
                    slug: input.appSlug,
                    OR: [{
                        organisation: {
                            permissionGrants: {
                                some: {
                                    userId: user?.id
                                    , OR: [{
                                        read: true
                                    },
                                    {
                                        write: true
                                    },
                                    {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                OR: [{
                                    read: true
                                },
                                {
                                    write: true
                                },
                                {
                                    admin: true
                                }]
                            }
                        }
                    }]
                },
                include: {
                    deployments: {
                        select: {
                            deploymentAddress: true
                        }
                    }
                }
            });

            if (!app)
                throw (new Error('No usage found'));

            const deploymentAddresses = app.deployments.flatMap((deployment) => deployment.deploymentAddress).filter(Boolean).map(address => address.fqdn);

            const { cursor } = input;
            const limit = input.limit ?? 50;
            const usages = (await prisma.usageRecord.findMany({
                orderBy: {
                    id: 'asc'
                }
            })).filter(usage => deploymentAddresses.includes(usage.data.consumption.fqdn));

            const usagesSlice = usages
                .sort((a, b) => b.data.consumption.timestamp - a.data.consumption.timestamp)
                .slice(cursor ?? 0, (cursor ?? 0) + limit);

            const usageCount = usages.length;
            let nextCursor: typeof cursor | undefined = undefined;
            if (usageCount > limit)
                nextCursor = (cursor ?? 0) ? (cursor ?? 0) + limit : limit;
            return {
                data: usagesSlice,
                meta: {
                    totalRowCount: usageCount
                },
                nextCursor
            };
        })
});

export default applicationRouter;