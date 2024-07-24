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
        })
});

export default activityRouter;