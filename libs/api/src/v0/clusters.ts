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

            return await prisma.clusterAllocation.findMany({
                where: {
                    organisation: {
                        applications: {
                            every: {
                                deployments: {
                                    some: {
                                        id: deploymentId
                                    }
                                }
                            }
                        }
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