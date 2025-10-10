import { createTRPCRouter, publicProcedure } from '../trpc';
import { logger, probotOps, scp, scpOps } from '@klave/providers';
import type { Application, Limits } from '@klave/db';
import { z } from 'zod';
import { config, getFinalParseConfig, KlaveGetCreditResult } from '@klave/constants';
import { deployToSubstrate } from '../deployment/deploymentController';

export const applicationRouter = createTRPCRouter({
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            if (!user)
                throw (new Error('You must be logged in to delete an application'));

            const manifest = await prisma.application.findMany({
                where: {
                    organisation: {
                        deletedAt: {
                            isSet: false
                        },
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                deletedAt: {
                                    isSet: false
                                },
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
                    },
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
                            userId: user?.id,
                            deletedAt: {
                                isSet: false
                            }
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
                        deletedAt: {
                            isSet: false
                        },
                        OR: [{
                            id: orgId
                        },
                        {
                            slug: orgSlug
                        }]
                    },
                    OR: [{
                        organisation: {
                            deletedAt: {
                                isSet: false
                            },
                            permissionGrants: {
                                some: {
                                    userId: user?.id,
                                    deletedAt: {
                                        isSet: false
                                    },
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
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                deletedAt: {
                                    isSet: false
                                },
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
                            userId: user?.id,
                            deletedAt: {
                                isSet: false
                            }
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
            }

            return await prisma.application.findUnique({
                where: {
                    id: appId,
                    OR: [{
                        organisation: {
                            deletedAt: {
                                isSet: false
                            },
                            permissionGrants: {
                                some: {
                                    userId: user?.id,
                                    deletedAt: {
                                        isSet: false
                                    },
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
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                deletedAt: {
                                    isSet: false
                                },
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
                            userId: user?.id,
                            deletedAt: {
                                isSet: false
                            }
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
                                    userId: user?.id,
                                    deletedAt: {
                                        isSet: false
                                    },
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
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                deletedAt: {
                                    isSet: false
                                },
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
                            userId: user?.id,
                            deletedAt: {
                                isSet: false
                            }
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
            provider: z.literal('github'),
            owner: z.string(),
            name: z.string(),
            applications: z.array(z.string()),
            organisationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { session, prisma }, input: { provider, owner, name, applications, organisationId } }) => {

            if (!session.user)
                throw (new Error('You must be logged in to register an application'));

            provider = provider.trim() as typeof provider;
            owner = owner.trim();
            name = name.trim();

            if (provider as string === '' || owner === '' || name === '')
                throw new Error('Missing parameters');

            if (provider === 'github') {

                const probot = probotOps.getProbot();
                if (!probot)
                    throw new Error('GitHub connection is not initialized');

                if (!session.githubToken?.accessToken) {
                    return {
                        success: false,
                        hasGithubToken: false,
                        message: 'GitHub token is not available'
                    };
                }

                const probotOctokit = await probot.auth();
                const installation = await probotOctokit.rest.apps.getRepoInstallation({
                    owner,
                    repo: name
                });
                const installationOctokit = await probot.auth(installation.data.id);

                try {
                    const targetRepo = await installationOctokit.rest.repos.get({
                        owner,
                        repo: name
                    });
                    const handle = await installationOctokit.rest.repos.getContent({
                        owner,
                        repo: name,
                        path: 'klave.json',
                        mediaType: {
                            format: 'raw+json'
                        }
                    });

                    const newParsedConfig = getFinalParseConfig(handle.data.toString());
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
                            .catch((e) => {
                                logger.error(`Failed to register: ${e}`);
                            });
                    });

                    applications.forEach(appName => {
                        (async () => {
                            const appSlug = appName.replaceAll(/\W/g, '-').toLocaleLowerCase();
                            const repo = await prisma.repo.upsert({
                                where: {
                                    source_owner_name: {
                                        source: provider,
                                        owner,
                                        name
                                    }
                                },
                                update: {
                                    // TODO: Use zod to validate the config
                                    defaultBranch: targetRepo.data.default_branch,
                                    config: newConfig
                                },
                                create: {
                                    source: provider,
                                    owner,
                                    name,
                                    defaultBranch: targetRepo.data.default_branch,
                                    // TODO: Use zod to validate the config
                                    config: newConfig
                                }
                            });
                            const newApp = await prisma.application.create({
                                data: {
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
                                }
                            });

                            logger.debug(`Registering application ${appSlug} (${newApp.id})`);

                            const lastCommits = await installationOctokit.rest.repos.listCommits({
                                owner,
                                repo: name,
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
                                    owner,
                                    name
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
                        })()
                            .catch((e) => {
                                logger.error(`Failed to deploy application '${appName}': ${e}`);
                            });
                    });
                    return {
                        success: true
                    };
                } catch (error) {
                    // If klave.json is not found, we can still return the repo without config
                    return {
                        success: false,
                        message: error instanceof Error ? error.message : 'An error occurred while registering the application'
                    };
                }
            } else {
                throw new Error('Unsupported provider');
            }
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
                                deletedAt: {
                                    isSet: false
                                },
                                permissionGrants: {
                                    some: {
                                        userId: user?.id,
                                        deletedAt: {
                                            isSet: false
                                        },
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
                                    deletedAt: {
                                        isSet: false
                                    },
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
                                deletedAt: {
                                    isSet: false
                                },
                                permissionGrants: {
                                    some: {
                                        userId: user?.id,
                                        deletedAt: {
                                            isSet: false
                                        },
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
                                    deletedAt: {
                                        isSet: false
                                    },
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

            await new Promise((resolve, reject) => {

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

            await new Promise((resolve, reject) => {

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
                    deletedAt: {
                        isSet: false
                    },
                    permissionGrants: {
                        some: {
                            userId: user?.id,
                            deletedAt: {
                                isSet: false
                            },
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
                            deletedAt: {
                                isSet: false
                            },
                            permissionGrants: {
                                some: {
                                    userId: user?.id,
                                    deletedAt: {
                                        isSet: false
                                    },
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
                    }, {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                deletedAt: {
                                    isSet: false
                                },
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