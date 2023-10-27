import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { logger, scp } from '@klave/providers';
import { sendToSecretarium } from '../deployment/deploymentController';

export const deploymentRouter = createTRPCRouter({
    getByApplication: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { appId } }) => {

            if (!appId)
                return [];

            return await prisma.deployment.findMany({
                where: {
                    applicationId: appId
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
        .query(async ({ ctx: { prisma }, input: { deploymentId } }) => {

            const deployment = await prisma.deployment.findUnique({
                where: {
                    id: deploymentId
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
        .query(async ({ ctx: { prisma, webId } }) => {

            const deploymentList = await prisma.deployment.findMany({
                where: {
                    application: {
                        webId
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
        .mutation(async ({ ctx: { prisma }, input: { deploymentId } }) => {
            logger.debug(`Deleting deployment ${deploymentId}`);
            await prisma.deployment.delete({
                where: {
                    id: deploymentId
                }
            });
            return;

        }),
    terminateDeployment: publicProcedure
        .input(z.object({
            deploymentId: z.string()
        }))
        .mutation(async ({ ctx: { prisma }, input: { deploymentId } }) => {
            // TODO The Secretarium connection should be ambient in the server
            await prisma.deployment.update({
                where: {
                    id: deploymentId
                },
                data: {
                    status: 'terminating'
                }
            });
            await scp.newTx('wasm-manager', 'unregister_smart_contract', `klave-termination-${deploymentId}`, {
                contract: {
                    name: `${deploymentId.split('-').pop()}.sta.klave.network`
                }
            }).onExecuted(async () => {
                await prisma.deployment.update({
                    where: {
                        id: deploymentId
                    },
                    data: {
                        status: 'terminated'
                    }
                });
            }).onError((error: any) => {
                console.error('Secretarium failed', error);
                // Timeout will eventually error this
            }).send();
        }),
    release: publicProcedure
        .input(z.object({
            deploymentId: z.string()
        }))
        .mutation(async ({ ctx: { prisma }, input: { deploymentId } }) => {

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
                    id: deploymentId
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


            targets.forEach(async target => {

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
                    }
                });

                sendToSecretarium({
                    deployment,
                    target,
                    wasmB64: existing.buildOutputWASM ?? ''
                });
            });

            return;

        })
});

export default deploymentRouter;