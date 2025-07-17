import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const activityRouter = createTRPCRouter({
    getByApplication: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { appId } }) => {

            if (!appId)
                return [];

            return await prisma.activityLog.findMany({
                where: {
                    applicationId: appId
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });

        }),
    getByOrganisation: publicProcedure
        .input(z.object({
            orgId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { orgId } }) => {

            if (!orgId)
                return [];

            return await prisma.activityLog.findMany({
                where: {
                    application: {
                        organisationId: orgId
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });

        }),
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            const domainList = await prisma.activityLog.findMany({
                where: {
                    application: {
                        organisation: {
                            permissionGrants: {
                                some: {
                                    OR: [{
                                        userId: user?.id
                                    }, {
                                        organisationId: user?.personalOrganisationId
                                    }]
                                }
                            }
                        }
                    }
                }
            });

            return domainList;
        })
});

export default activityRouter;