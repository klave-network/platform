import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { Organisation } from '@klave/db';
import { scp } from '@klave/providers';
import { config, reservedNames } from '@klave/constants';
import { createTransport } from 'nodemailer';
import { render } from '@react-email/components';
import { OrganisationConfirmationEmail } from '@klave/ui-kit';

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
                            deletedAt: {
                                isSet: false
                            },
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
                        where: {
                            deletedAt: {
                                isSet: false
                            }
                        },
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
                            deletedAt: {
                                isSet: false
                            },
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
                        where: {
                            deletedAt: {
                                isSet: false
                            }
                        },
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

            const fetchedUser = await prisma.user.findFirst({
                where: {
                    id: user.id
                },
                select: {
                    emails: true,
                    slug: true
                }
            });

            if (!fetchedUser)
                throw new Error('User does not exist');

            const transporter = createTransport(config.get('KLAVE_SMTP_HOST'));
            const [keySelector, domainName] = config.get('KLAVE_DKIM_DOMAIN', '@').split('@');
            const confirmationEmail = await render(OrganisationConfirmationEmail({ userSlug: fetchedUser.slug, orgSlug: slug }));

            if (!keySelector || !domainName)
                throw new Error('DKIM domain not set');

            await transporter.sendMail({
                from: config.get('KLAVE_NOREPLY_ADDRESS'),
                to: fetchedUser.emails[0], // unsure if we should send email to all addresses
                subject: 'Your organisation is now live on Klave',
                html: confirmationEmail,
                dkim: {
                    domainName,
                    keySelector,
                    privateKey: config.get('KLAVE_DKIM_PRIVATE_KEY')
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
                                deletedAt: {
                                    isSet: false
                                },
                                OR: [{
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
                        id: orgId,
                        permissionGrants: {
                            some: {
                                userId: user.id,
                                deletedAt: {
                                    isSet: false
                                },
                                OR: [{
                                    write: true
                                }, {
                                    admin: true
                                }]
                            }
                        }
                    },
                    data
                });

        }),
    delete: publicProcedure
        .input(z.object({
            organisationId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { organisationId } }) => {

            if (!user)
                throw new Error('Not logged in');

            await prisma.organisation.update({
                where: {
                    id: organisationId,
                    permissionGrants: {
                        some: {
                            userId: user.id,
                            deletedAt: {
                                isSet: false
                            },
                            admin: true
                        }
                    }
                },
                data: {
                    deletedAt: new Date()
                }
            });

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
            await new Promise((resolve, reject) => {
                scp.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'add_kredit', `klave-app-set-kredit-${application.id}`, {
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
        }),
    infiniteOrganisations: publicProcedure
        .input(
            z.object({
                filterUnitialized: z.boolean().nullish(),
                limit: z.number().min(1).max(1000).nullish(),
                cursor: z.string().nullish() // <-- "cursor" needs to exist, but can be any type
            })
        )
        .query(async ({ ctx: { session, prisma }, input }) => {

            if (!session.user?.globalAdmin) {
                throw new Error('Not authenticated');
            }

            const { cursor } = input;
            const limit = input.limit ?? 50;
            const organisations = (await prisma.organisation.findMany({
                take: limit + 1, // get an extra item at the end which we'll use as next cursor
                // where: {
                //     slug: {
                //         not: {
                //             startsWith: '~$~*'
                //         }
                //     }
                // },
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
            })).filter(org => input.filterUnitialized ? !org.slug.startsWith('~$~') : true);
            const organisationCount = organisations.length;
            let nextCursor: typeof cursor | undefined = undefined;
            if (organisationCount > limit) {
                const nextItem = organisations.pop();
                nextCursor = nextItem?.id;
            }
            return {
                data: organisations,
                meta: {
                    totalRowCount: organisationCount
                },
                nextCursor
            };
        }),
    addMember: publicProcedure
        .input(z.object({
            orgId: z.string().uuid(),
            userSlug: z.string(),
            read: z.boolean().optional(),
            write: z.boolean().optional(),
            admin: z.boolean().optional()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { orgId, userSlug, read, write, admin } }) => {

            if (!user)
                throw new Error('Not logged in');

            const org = await prisma.organisation.findUnique({
                where: {
                    id: orgId
                }
            });

            if (!org)
                throw new Error('Organisation not found');

            const currentPermissionGrant = await prisma.permissionGrant.findFirst({
                where: {
                    organisationId: orgId,
                    userId: user.id
                }
            });

            if (!currentPermissionGrant || !currentPermissionGrant.admin)
                throw new Error('Not enough permissions');

            const principal = await prisma.user.findUnique({
                where: {
                    slug: userSlug
                }
            });

            if (!principal)
                throw new Error('User not found');

            const permissionGrant = await prisma.permissionGrant.findFirst({
                where: {
                    organisationId: org.id,
                    userId: principal.id
                }
            });

            if (permissionGrant)
                await prisma.permissionGrant.update({
                    where: {
                        id: permissionGrant.id
                    },
                    data: {
                        read: read ?? permissionGrant.read,
                        write: write ?? permissionGrant.write,
                        admin: admin ?? permissionGrant.admin
                    }
                });
            else
                await prisma.permissionGrant.create({
                    data: {
                        organisationId: org.id,
                        userId: principal.id,
                        read: read ?? false,
                        write: write ?? false,
                        admin: admin ?? false
                    }
                });

        }),
    removeMember: publicProcedure
        .input(z.object({
            grantId: z.string().uuid()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { grantId } }) => {

            if (!user)
                throw new Error('Not logged in');

            const permissionGrant = await prisma.permissionGrant.findUnique({
                where: {
                    id: grantId
                }
            });

            if (!permissionGrant)
                throw new Error('Permission grant not found');

            const currentPermissionGrant = await prisma.permissionGrant.findFirst({
                where: {
                    organisationId: permissionGrant.organisationId,
                    userId: user.id
                }
            });

            if (!currentPermissionGrant || !currentPermissionGrant.admin)
                throw new Error('Not enough permissions');

            await prisma.permissionGrant.updateMany({
                where: {
                    id: permissionGrant.id
                },
                data: {
                    deletedAt: new Date()
                }
            });
        })
});

export default organisationRouter;
