import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { Organisation } from '@prisma/client';

export const organisationRouter = createTRPCRouter({
    getPersonal: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {
            if (!user)
                return;
            return (await prisma.organisation.findMany({
                where: {
                    creatorId: user.id,
                    personal: true
                }
            }))[0];
        }),
    getAll: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            const permissionGrants = await prisma.permissionGrant.findMany({
                where: {
                    userId: user?.id,
                    organisationId: {
                        not: null
                    }
                },
                include: {
                    organisation: true
                }
            });

            return permissionGrants.map(({ organisation }) => organisation).filter(Boolean);
        }),
    getAllWithWrite: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            const permissionGrants = await prisma.permissionGrant.findMany({
                where: {
                    userId: user?.id,
                    organisationId: {
                        not: null
                    },
                    OR: [{
                        admin: true
                    }, {
                        write: true
                    }]
                },
                include: {
                    organisation: true
                }
            });

            return permissionGrants.map(({ organisation }) => organisation).filter(Boolean);
        }),
    getById: publicProcedure
        .input(z.object({
            orgId: z.string().uuid()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { orgId } }) => {

            if (!user)
                return;

            return await prisma.organisation.findUnique({
                where: {
                    id: orgId,
                    permissionGrants: {
                        some: {
                            userId: user.id,
                            OR: [{
                                read: true
                            }, {
                                write: true
                            }, {
                                admin: true
                            }]
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    kredits: true,
                    personal: true,
                    permissionGrants: {
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
            orgSlug: z.string()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { orgSlug } }) => {

            if (!user)
                return;

            return await prisma.organisation.findUnique({
                where: {
                    slug: orgSlug,
                    permissionGrants: {
                        some: {
                            userId: user.id,
                            OR: [{
                                read: true
                            }, {
                                write: true
                            }, {
                                admin: true
                            }]
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    kredits: true,
                    personal: true,
                    permissionGrants: {
                        include: {
                            user: true,
                            organisation: true
                        }
                    }
                }
            });

        }),
    exists: publicProcedure
        .input(z.object({
            orgSlug: z.string()
        }))
        .query(async ({ ctx: { prisma }, input: { orgSlug } }) => {

            const slug = orgSlug.replaceAll(/\W/g, '-').toLocaleLowerCase();

            if (slug.trim() === '')
                return false;

            const org = await prisma.organisation.findUnique({
                where: {
                    slug
                }
            });

            return org !== null;

        }),
    create: publicProcedure
        .input(z.object({
            slug: z.string(),
            data: z.custom<Partial<Organisation>>()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { slug: orgSlug, data } }) => {

            const slug = orgSlug.replaceAll(/\W/g, '-').toLocaleLowerCase();

            if (!user)
                return;

            const org = await prisma.organisation.create({
                data: {
                    slug,
                    name: '',
                    ...data,
                    creatorId: user.id,
                    permissionGrants: {
                        create: {
                            userId: user.id,
                            read: true,
                            write: true,
                            admin: true
                        }
                    }
                }
            });

            return org;

        }),
    update: publicProcedure
        .input(z.object({
            orgId: z.string().uuid(),
            data: z.custom<Partial<Organisation>>()
        }).or(z.object({
            orgSlug: z.string().uuid(),
            data: z.custom<Partial<Organisation>>()
        })))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { data, ...orgInfo } }) => {
            if (!user)
                return;
            const { orgId, orgSlug } = orgInfo as Record<string, string>;
            if (orgSlug)
                await prisma.organisation.update({
                    where: {
                        slug: orgSlug,
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                OR: [{
                                    read: true
                                }, {
                                    write: true
                                }, {
                                    admin: true
                                }]
                            }
                        }
                    },
                    data
                });
            else
                await prisma.organisation.update({
                    where: {
                        id: orgId
                    },
                    data
                });
            return;

        }),
    delete: publicProcedure
        .input(z.object({
            organisationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma }, input: { organisationId } }) => {

            await prisma.organisation.delete({
                where: {
                    id: organisationId
                }
            });
            return;

        })
});

export default organisationRouter;