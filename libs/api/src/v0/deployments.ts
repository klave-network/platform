import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import * as Sentry from '@sentry/node';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { logger, scp } from '@klave/providers';
import { sendToSecretarium } from '../deployment/deploymentController';

export const deploymentRouter = createTRPCRouter({
    getByApplication: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { appId } }) => {

            if (!user)
                return;
            if (!appId)
                return [];

            return await prisma.deployment.findMany({
                where: {
                    application: {
                        id: appId,
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                AND: {
                                    OR: [{
                                        read: true
                                    }, {
                                        write: true
                                    }, {
                                        admin: true
                                    }]
                                }
                            }

                        }
                    }
                },
                include: {
                    deploymentAddress: {
                        select: {
                            fqdn: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });

        }),
    getById: publicProcedure
        .input(z.object({
            deploymentId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { deploymentId } }) => {

            if (!user)
                return;

            const deployment = await prisma.deployment.findUnique({
                where: {
                    id: deploymentId,
                    application: {
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                AND: {
                                    OR: [{
                                        read: true
                                    }, {
                                        write: true
                                    }, {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }
                },
                include: {
                    deploymentAddress: {
                        select: {
                            fqdn: true
                        }
                    }
                }
            });

            return deployment;
        }),
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            if (!user)
                return;

            const deploymentList = await prisma.deployment.findMany({
                where: {
                    application: {
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                AND: {
                                    OR: [{
                                        read: true
                                    }, {
                                        write: true
                                    }, {
                                        admin: true
                                    }]
                                }
                            }

                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });

            return deploymentList;
        }),
    delete: publicProcedure
        .input(z.object({
            deploymentId: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session: { user }, override }, input: { deploymentId } }) => {
            if (!user && !override)
                return;
            logger.debug(`Deleting deployment ${deploymentId}`);
            await prisma.deployment.delete({
                where: {
                    id: deploymentId,
                    application: override !== '__system_post_deploy' && override !== '__system_pruner_cleaner' ? {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                AND: {
                                    OR: [{
                                        admin: true
                                    }]
                                }
                            }
                        }
                    } : undefined
                }
            });
            return;

        }),
    terminateDeployment: publicProcedure
        .input(z.object({
            deploymentId: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session: { user }, override }, input: { deploymentId } }) => {
            if (!user && !override)
                return;

            const dep = await prisma.deployment.update({
                where: {
                    id: deploymentId,
                    application: override !== '__system_pruner_terminator' ? {
                        permissionGrants: {
                            some: {
                                userId: user?.id,
                                AND: {
                                    OR: [{
                                        write: true
                                    }, {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    } : undefined
                },
                data: {
                    status: 'terminating'
                },
                include: {
                    deploymentAddress: true
                }
            });
            await Sentry.startSpan({
                name: 'SCP Subtask',
                op: 'scp.task',
                description: 'Secretarium Task'
            }, async () => {
                return await scp.newTx('wasm-manager', 'deactivate_instance', `klave-termination-${deploymentId}`, {
                    app_id: dep.applicationId,
                    fqdn: dep.deploymentAddress?.fqdn
                }).onExecuted(() => {
                    (async () => {
                        await prisma.deployment.update({
                            where: {
                                id: deploymentId
                            },
                            data: {
                                status: 'terminated'
                            }
                        });
                    })().catch(() => { return; });
                }).onError((error) => {
                    console.error('Secretarium failed', error);
                    // Timeout will eventually error this
                }).send();
            }).catch(() => {
                // Swallow this error
            });
        }),
    release: publicProcedure
        .input(z.object({
            deploymentId: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { deploymentId } }) => {

            if (!user)
                return;

            // await prisma.deployment.update({
            //     where: {
            //         id: deploymentId
            //     },
            //     data: {
            //         released: true,
            //         life: 'long'
            //     }
            // });

            const existing = await prisma.deployment.findUnique({
                where: {
                    id: deploymentId,
                    application: {
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                AND: {
                                    OR: [{
                                        write: true
                                    }, {
                                        admin: true
                                    }]
                                }
                            }
                        }
                    }
                }
            });

            if (!existing?.buildOutputWASM)
                return null;

            const domains = await prisma.domain.findMany({
                where: {
                    applicationId: existing.applicationId,
                    verified: true
                }
            });

            const targets = domains
                .map(domain => `${existing.applicationId.split('-').shift()}.${domain.fqdn}`)
                .concat(`${existing.applicationId.split('-').shift()}.sta.klave.network`);


            targets.forEach(target => {

                (async () => {

                    const deployment = await prisma.deployment.create({
                        data: {
                            ...existing,
                            id: undefined,
                            set: uuid(),
                            expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                            createdAt: undefined,
                            updatedAt: undefined,
                            applicationId: undefined,
                            application: {
                                connect: {
                                    id: existing.applicationId
                                }
                            },
                            deploymentAddress: {
                                create: {
                                    fqdn: target
                                }
                            },
                            life: 'long'
                        },
                        include: {
                            deploymentAddress: true
                        }
                    });

                    await sendToSecretarium({
                        deployment,
                        target
                    });
                })()
                    .catch(() => { return; });

            });

            return;

        })
});

export default deploymentRouter;