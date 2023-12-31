import { z } from 'zod';
import * as dns from 'dns/promises';
import { v4 as uuid } from 'uuid';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const domainRouter = createTRPCRouter({
    getByApplication: publicProcedure
        .input(z.object({
            appId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma }, input: { appId } }) => {

            if (!appId)
                return [];

            return await prisma.domain.findMany({
                where: {
                    applicationId: appId
                }
            });

        }),
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, webId } }) => {

            const domainList = await prisma.domain.findMany({
                where: {
                    application: {
                        webId
                    }
                }
            });

            return domainList;
        }),
    validate: publicProcedure
        .input(z.object({ domainId: z.string().uuid() }))
        .mutation(async ({ ctx: { prisma }, input: { domainId } }) => {

            const domain = await prisma.domain.findUnique({
                where: {
                    id: domainId
                }
            });

            if (!domain)
                return null;

            const txtRecords = await dns.resolveTxt(domain?.fqdn);
            await prisma.domain.update({
                where: { id: domain.id },
                data: { verified: txtRecords.filter(([record]) => record === domain.token).length > 0 }
            });

            return txtRecords;
        }),
    add: publicProcedure
        .input(z.object({
            applicationId: z.string().uuid(),
            fqdn: z.string().regex(/^[0-9\p{L}][0-9\p{L}\-.]{1,61}[0-9\p{L}]\.[0-9\p{L}][\p{L}-]*[0-9\p{L}]+$/ugm)
        }))
        .mutation(async ({ ctx: { prisma }, input: { applicationId, fqdn } }) => {

            // if (fqdn.trim() === '')
            //     throw new Error('The FQDN was not the right format');

            return await prisma.domain.create({
                data: {
                    fqdn,
                    verified: false,
                    token: `secretarium=v1 trustless-bundle-verification=${uuid()}`,
                    application: {
                        connect: {
                            id: applicationId
                        }
                    }
                }
            });
        }),
    delete: publicProcedure
        .input(z.object({
            domainId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma }, input: { domainId } }) => {

            await prisma.domain.delete({
                where: {
                    id: domainId
                }
            });
            return;

        })
});

export default domainRouter;