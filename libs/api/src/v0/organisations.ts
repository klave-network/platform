import { z } from 'zod';
import * as Sentry from '@sentry/node';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { Organisation } from '@klave/db';
import { scp } from '@klave/providers';
import { reservedNames } from '@klave/constants';

export const organisationRouter = createTRPCRouter({
    getPersonal: publicProcedure
        .query(async ({ ctx: { prisma, session: { user } } }) => {

            if (!user)
                throw new Error('Not logged in');

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

            if (!user)
                throw new Error('Not logged in');

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
                throw new Error('Not logged in');

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
                throw new Error('Not logged in');

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

            const slug = orgSlug.trim().replaceAll(/\W/g, '-').toLocaleLowerCase();

            if (slug === '')
                return false;

            if (reservedNames.includes(slug))
                return true;

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

            if (!user)
                throw new Error('Not logged in');

            const slug = orgSlug.trim().replaceAll(/\W/g, '-').toLocaleLowerCase();

            if (reservedNames.includes(slug))
                throw new Error('Organisation already exists');

            const existingOrg = await prisma.organisation.findUnique({
                where: {
                    slug
                }
            });

            if (existingOrg)
                throw new Error('Organisation already exists');

            const org = await prisma.organisation.create({
                data: {
                    slug,
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
                throw new Error('Not logged in');

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
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { organisationId } }) => {

            if (!user)
                throw new Error('Not logged in');

            await prisma.organisation.delete({
                where: {
                    id: organisationId
                }
            });
            return;

        }),
    allocationCredits: publicProcedure
        .input(z.object({
            applicationId: z.string().uuid(),
            amount: z.number().int()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { applicationId, amount } }) => {

            if (!user)
                throw new Error('Not logged in');

            const application = await prisma.application.findUnique({
                where: {
                    id: applicationId
                }
            });

            if (!application)
                throw new Error('Application not found');

            const organisation = await prisma.organisation.findUnique({
                where: {
                    id: application.organisationId
                }
            });

            if (!organisation)
                throw new Error('Organisation not found');

            if (organisation.kredits < amount)
                throw new Error('Not enough credits');

            await prisma.$transaction([
                prisma.application.update({
                    where: {
                        id: applicationId
                    },
                    data: {
                        kredits: {
                            increment: amount
                        }
                    }
                }),
                prisma.organisation.update({
                    where: {
                        id: organisation.id
                    },
                    data: {
                        kredits: {
                            decrement: amount
                        }
                    }
                })
            ]);
            await Sentry.startSpan({
                name: 'SCP Subtask',
                op: 'scp.task',
                description: 'Secretarium Task'
            }, async () => {
                return await new Promise((resolve, reject) => {
                    scp.newTx('wasm-manager', 'add_kredit', `klave-app-set-kredit-${application.id}`, {
                        app_id: application.id,
                        kredit: amount
                    }).onResult(result => {
                        resolve(result);
                    }).onExecuted(result => {
                        resolve(result);
                    }).onError(error => {
                        reject(error);
                    }).send()
                        .catch(reject);
                });
            });
        }),
    infiniteOrganisations: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish() // <-- "cursor" needs to exist, but can be any type
            })
        )
        .query(async ({ ctx: { session, prisma }, input }) => {

            if (!session.user?.globalAdmin) {
                throw new Error('Not authenticated');
            }

            const organisationCount = await prisma.organisation.count();
            const { cursor } = input;
            const limit = input.limit ?? 50;
            const organisations = await prisma.organisation.findMany({
                take: limit + 1, // get an extra item at the end which we'll use as next cursor
                cursor: cursor ? {
                    id: cursor
                } : undefined,
                orderBy: {
                    id: 'asc'
                },
                include: {
                    creator: true,
                    applications: true
                }
            });
            let nextCursor: typeof cursor | undefined = undefined;
            if (organisations.length > limit) {
                const nextItem = organisations.pop();
                nextCursor = nextItem!.id;
            }
            return {
                data: organisations,
                meta: {
                    totalRowCount: organisationCount
                },
                nextCursor
            };
        })
});

export default organisationRouter;