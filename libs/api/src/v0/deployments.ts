import { z } from 'zod';
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

            const referenceDeployment = await prisma.deployment.findUnique({
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
                },
                include: {
                    deploymentAddress: true
                }
            });

            if (!referenceDeployment?.buildOutputWASM)
                return null;

            const parentApplication = await prisma.application.findUnique({
                where: {
                    id: referenceDeployment.applicationId
                }
            });

            if (!parentApplication)
                return null;

            const domains = await prisma.domain.findMany({
                where: {
                    applicationId: referenceDeployment.applicationId,
                    verified: true
                }
            });

            const targets = domains
                .flatMap(domain => [
                    `${parentApplication.slug}.${domain.fqdn}`,
                    `${parentApplication.id.split('-').shift()}.${domain.fqdn}`
                ])
                .concat(`${parentApplication.slug}.sta.klave.network`, `${parentApplication.id.split('-').shift()}.sta.klave.network`);

            targets.forEach(target => {

                (async () => {

                    if (!referenceDeployment)
                        return;

                    const previousDeployment = await prisma.deployment.findFirst({
                        where: {
                            deploymentAddress: {
                                fqdn: target
                            },
                            status: {
                                not: 'errored'
                            }
                        },
                        include: {
                            deploymentAddress: true
                        }
                    });

                    if (previousDeployment)
                        await prisma.deployment.update({
                            where: {
                                id: previousDeployment.id
                            },
                            data: {
                                status: 'updating'
                            }
                        });

                    const deployment = await prisma.deployment.create({
                        data: {
                            ...referenceDeployment,
                            id: undefined,
                            set: referenceDeployment.set,
                            expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                            createdAt: undefined,
                            updatedAt: undefined,
                            applicationId: undefined,
                            application: {
                                connect: {
                                    id: referenceDeployment.applicationId
                                }
                            },
                            deploymentAddress: {
                                create: {
                                    fqdn: target
                                }
                            },
                            life: 'long',
                            status: 'deploying'
                        },
                        include: {
                            deploymentAddress: true
                        }
                    });

                    await sendToSecretarium({
                        deployment,
                        wasmB64: referenceDeployment?.buildOutputWASM ?? undefined,
                        previousDeployment,
                        target
                    });
                })()
                    .catch(() => { return; });

            });

            return;

        })
});

export default deploymentRouter;