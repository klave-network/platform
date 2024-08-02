import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const activityRouter = createTRPCRouter({
    getAllocationByDeploymentId: publicProcedure
        .input(z.object({
            deploymentId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { deploymentId } }) => {

            if (!deploymentId)
                return [];

            const deployment = await prisma.deployment.findUnique({
                where: {
                    id: deploymentId
                },
                select: {
                    application: {
                        select: {
                            organisationId: true
                        }
                    }
                }
            });

            if (!deployment)
                return [];

            return await prisma.clusterAllocation.findMany({
                where: {
                    organisation: {
                        id: deployment.application.organisationId
                    },
                    AND: {
                        OR: [{
                            read: true
                        }, {
                            write: true
                        }, {
                            admin: true
                        }]
                    }
                },
                include: {
                    cluster: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }),
    getAllocationByOrganisationId: publicProcedure
        .input(z.object({
            organisationId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { organisationId } }) => {

            if (!organisationId)
                return [];

            return await prisma.clusterAllocation.findMany({
                where: {
                    organisation: {
                        id: organisationId
                    },
                    AND: {
                        OR: [{
                            read: true
                        }, {
                            write: true
                        }, {
                            admin: true
                        }]
                    }
                },
                include: {
                    cluster: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }),
    addCluster: publicProcedure
        .input(z.object({
            organisationId: z.string().uuid(),
            name: z.string(),
            fqdn: z.string()
        }))
        .mutation(async ({ ctx: { prisma }, input: { organisationId, name, fqdn } }) => {

            if (!organisationId || !name)
                return null;

            return await prisma.cluster.create({
                data: {
                    name,
                    fqdn,
                    clusterAllocations: {
                        create: {
                            organisationId,
                            read: true,
                            write: true,
                            admin: true
                        }
                    }
                }
            });
        }),
    deleteAllocation: publicProcedure
        .input(z.object({
            allocationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma }, input: { allocationId } }) => {

            if (!allocationId)
                return false;

            await prisma.clusterAllocation.delete({
                where: {
                    id: allocationId
                }
            });

            return true;
        }),
    delete: publicProcedure
        .input(z.object({
            clusterId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma }, input: { clusterId } }) => {

            if (!clusterId)
                return false;

            await prisma.cluster.delete({
                where: {
                    id: clusterId
                }
            });

            return true;
        })
});

export default activityRouter;