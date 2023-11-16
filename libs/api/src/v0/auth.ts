import { logger } from '@klave/providers';
import idgen from '@ideafast/idgen';
import { publicProcedure, createTRPCRouter } from '../trpc';
import { webcrypto } from 'node:crypto';
import { createTransport } from 'nodemailer';
import FakeMailGuard from 'fakemail-guard';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { type startRegistration, type startAuthentication } from '@simplewebauthn/browser';
import { Utils } from '@secretarium/connector';
// import * as passport from 'passport';
import { z } from 'zod';

const mailGuard = new FakeMailGuard({
    allowDisposable: false,
    allowFreemail: true
});


let origin: string;
let rpID: string;

const setWebauthnPrimitives = () => {
    origin = process.env['KLAVE_WEBAUTHN_ORIGIN'] ?? 'http://localhost';
    rpID = new URL(origin).hostname;
};

export const authRouter = createTRPCRouter({
    getSession: publicProcedure.query(async ({ ctx }) => {
        return {
            // session: ctx.session,
            // sessionID: ctx.sessionID,
            me: /*ctx.user ?? */ctx.session.user,
            webId: ctx.webId,
            hasUnclaimedApplications: false,
            hasGithubToken: !!ctx.web.githubToken
            // hasUnclaimedApplications: !(ctx.user ?? ctx.session.user) && (await ctx.prisma.application.count({
            //     where: {
            //         webId: ctx.webId
            //     }
            // })).valueOf() > 0
            // web: ctx.web
        };
    }),
    updateSlug: publicProcedure
        .input(z.object({
            slug: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore }, input: { slug } }) => {

            if (!session.user)
                return;

            const newSlug = slug.replaceAll(/\W/g, '-').toLocaleLowerCase();
            const existingOrg = await prisma.organisation.findUnique({
                where: {
                    slug: newSlug
                }
            });

            if (existingOrg)
                throw new Error('This name is already taken');

            const user = await prisma.user.update({
                where: {
                    id: session.user.id
                },
                data: {
                    slug: newSlug
                }
            });

            const personalOrg = await prisma.organisation.update({
                where: {
                    creatorId: user.id,
                    personal: true,
                    slug: session.user.slug
                },
                data: {
                    slug: newSlug
                }
            });

            await new Promise<void>((resolve, reject) => {
                session.save(() => {
                    sessionStore.set(session.id, {
                        ...session,
                        user: {
                            id: user.id,
                            slug: user.slug,
                            personalOrganisationId: personalOrg.id
                        }
                    }, (err) => {
                        if (err)
                            reject(err);
                        resolve();
                    });
                });
            });

            return {
                ok: true
            };
        }),
    getEmailHints: publicProcedure
        .input(z.object({
            partialEmail: z.string()
        }))
        .query(async ({ input: { partialEmail } }) => {
            const hint = mailGuard.check(partialEmail);
            if (hint.errors.includes('disposable'))
                return ({
                    sucess: false,
                    message: 'We do not accept disposable email addresses.'
                });

            if (hint.typo)
                return ({
                    sucess: true,
                    message: `Did you mean ${hint.typo}?`
                });
            return ({
                sucess: true
            });
        }),
    getEmailCode: publicProcedure
        .input(z.object({
            email: z.string().email()
        }))
        .mutation(async ({ ctx: { prisma, webId }, input: { email } }) => {

            const hint = mailGuard.check(email);
            if (hint.errors.includes('disposable'))
                throw new Error('We do not accept disposable email addresses.');

            const betaDomainsAllowed = process.env['KLAVE_BETA_DOMAIN_FILTER']?.split(',') ?? [];
            const emailDomain = hint.domain;

            if (!emailDomain || (betaDomainsAllowed.length > 0 && !betaDomainsAllowed.includes(emailDomain)))
                throw new Error('It looks like you are not part of Klave\'s beta program');

            try {
                let user = await prisma.user.findFirst({
                    where: {
                        emails: {
                            has: email
                        }
                    },
                    select: {
                        id: true
                    }
                });
                if (!user) {
                    const slug = `~$~${idgen.generate(10)}`;
                    const newUser = await prisma.user.create({
                        data: {
                            slug,
                            emails: [email],
                            webs: {
                                connect: { id: webId }
                            },
                            createdOrganisations: {
                                create: {
                                    name: 'Personal',
                                    slug,
                                    personal: true
                                }
                            }
                        },
                        include: {
                            createdOrganisations: true
                        }
                    });
                    if (!newUser.createdOrganisations[0])
                        throw new Error('Could not create personal organisation');
                    await prisma.permissionGrant.create({
                        data: {
                            user: {
                                connect: {
                                    id: newUser.id
                                }
                            },
                            organisation: {
                                connect: {
                                    id: newUser.createdOrganisations[0].id
                                }
                            },
                            read: true,
                            write: true,
                            admin: true
                        }
                    });
                    user = {
                        id: newUser.id
                    };
                }

                const temporaryCode = `${Math.random()}`.substring(2, 11);
                const transporter = createTransport(process.env['KLAVE_SMTP_HOST']);
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        loginCode: temporaryCode,
                        loginCodeCreatedAt: new Date()
                    }
                });
                const [keySelector, domainName] = (process.env['KLAVE_DKIM_DOMAIN'] ?? '@').split('@');
                if (!keySelector || !domainName)
                    throw new Error('DKIM domain not set');
                await transporter.sendMail({
                    from: process.env['KLAVE_NOREPLY_ADDRESS'],
                    to: email,
                    subject: 'Login code',
                    text: `Your Klave login code is: ${temporaryCode.substring(0, 3)}-${temporaryCode.substring(3, 6)}-${temporaryCode.substring(6, 9)}`,
                    dkim: {
                        domainName,
                        keySelector,
                        privateKey: process.env['KLAVE_DKIM_PRIVATE_KEY'] ?? ''
                    }
                });
                return {
                    ok: true
                };
            } catch (e) {
                // TODO Move to logging service
                logger.error('Error sending email', e);
                return {
                    ok: false
                };
            }
        }),
    verifyEmailCode: publicProcedure
        .input(z.object({
            email: z.string().email(),
            code: z.string(),
            authenticate: z.boolean().default(true)
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore, webId }, input: { email, code, authenticate } }) => {
            const user = await prisma.user.findFirst({
                where: {
                    emails: {
                        has: email
                    }
                },
                select: {
                    id: true,
                    slug: true,
                    loginCode: true,
                    loginCodeCreatedAt: true,
                    createdOrganisations: {
                        where: {
                            personal: {
                                equals: true
                            }
                        },
                        select: {
                            id: true
                        }
                    }
                }
            });
            if (!user || user.loginCode === undefined)
                throw new Error('User not found');
            if (user.loginCode !== code || !user.loginCodeCreatedAt || user.loginCodeCreatedAt < new Date(Date.now() - 1000 * 60 * 5))
                throw new Error('Invalid code');
            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    loginCode: null,
                    loginCodeCreatedAt: null,
                    webs: {
                        connect: {
                            id: webId
                        }
                    }
                }
            });
            if (authenticate)
                await new Promise<void>((resolve, reject) => {

                    session.save(() => {
                        sessionStore.set(session.id, {
                            ...session,
                            user: {
                                id: user.id,
                                personalOrganisationId: user.createdOrganisations[0]?.id,
                                slug: user.slug
                            }
                        }, (err) => {
                            if (err)
                                reject(err);
                            resolve();
                        });
                    });
                });
            return {
                ok: true
            };
        }),
    getWebauthAuthenticationOptions: publicProcedure
        .input(z.object({
            email: z.string().email()
        }))
        .query(async ({ ctx: { prisma }, input: { email } }) => {

            const hint = mailGuard.check(email);
            if (hint.errors.includes('disposable'))
                throw new Error('We do not accept disposable email addresses.');

            const betaDomainsAllowed = process.env['KLAVE_BETA_DOMAIN_FILTER']?.split(',') ?? [];
            const emailDomain = hint.domain;

            if (!emailDomain || (betaDomainsAllowed.length > 0 && !betaDomainsAllowed.includes(emailDomain)))
                throw new Error('It looks like you are not part of Klave\'s beta program');

            const user = await prisma.user.findFirst({
                where: {
                    emails: {
                        has: email
                    }
                },
                select: {
                    id: true
                }
            });

            if (!rpID)
                setWebauthnPrimitives();

            const options = await generateAuthenticationOptions({
                timeout: 60000,
                // allowCredentials: user.devices.map(dev => ({
                //     id: Buffer.from(dev.credentialID),
                //     type: 'public-key' as const,
                //     transports: dev.transports
                // })),
                userVerification: 'required' as const,
                rpID
            });

            if (user)
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        webauthChallenge: options.challenge,
                        webauthChallengeCreatedAt: new Date()
                    }
                });

            return options;
        }),
    validateWebauthn: publicProcedure
        .input(z.object({
            email: z.string(),
            data: z.custom<Awaited<ReturnType<typeof startAuthentication>>>()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore }, input: { email, data } }) => {

            const credId = data.id.padEnd(data.id.length + 4 - data.id.length % 4, '=');
            logger.debug(`wan: Seeking credID ${credId} for email ${email}`);
            const user = await prisma.user.findFirst({
                where: {
                    emails: {
                        has: email
                    },
                    webauthCredentials: {
                        some: {
                            credentialID: credId
                        }
                    }
                },
                select: {
                    id: true,
                    slug: true,
                    webauthChallenge: true,
                    webauthCredentials: true,
                    createdOrganisations: {
                        where: {
                            personal: {
                                equals: true
                            }
                        },
                        select: {
                            id: true
                        }
                    }
                }
            });

            if (!user) {
                logger.debug('wan: User could not be found');
                return {
                    ok: false,
                    error: 'Invalid authentication response'
                };
            }

            const authenticator = user?.webauthCredentials.find(cred => cred.credentialID === credId);

            if (!authenticator) {
                logger.debug('wan: Authenticator could not be found');
                return {
                    ok: false,
                    error: 'Invalid authentication response'
                };
            }

            if (!rpID)
                setWebauthnPrimitives();

            const { verified, authenticationInfo } = await verifyAuthenticationResponse({
                response: data,
                expectedChallenge: `${user.webauthChallenge}`,
                expectedOrigin: origin,
                expectedRPID: rpID,
                authenticator: {
                    credentialPublicKey: Utils.fromBase64(authenticator.credentialPublicKey),
                    credentialID: Utils.fromBase64(authenticator.credentialID),
                    counter: authenticator.counter
                }
            });

            if (!verified) {
                logger.debug('wan: Authentication response could not be verified');
                return {
                    ok: false,
                    error: 'Invalid authentication response'
                };
            }

            const { newCounter } = authenticationInfo;

            await prisma.webauthCredential.update({
                where: {
                    id: authenticator.id
                },
                data: {
                    counter: newCounter
                }
            });

            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    webauthChallenge: null,
                    webauthChallengeCreatedAt: null
                }
            });

            await new Promise<void>((resolve, reject) => {
                session.save(() => {
                    sessionStore.set(session.id, {
                        ...session,
                        user: {
                            id: user.id,
                            personalOrganisationId: user.createdOrganisations[0]?.id,
                            slug: user.slug
                        }
                    }, (err) => {
                        if (err)
                            reject(err);
                        resolve();
                    });
                });
            });

            return {
                ok: true
            };
        }),
    getWebauthRegistrationOptions: publicProcedure
        .input(z.object({
            email: z.string().email()
        }))
        .query(async ({ ctx: { prisma }, input: { email } }) => {

            const hint = mailGuard.check(email);
            if (hint.errors.includes('disposable'))
                throw new Error('We do not accept disposable email addresses.');

            const betaDomainsAllowed = process.env['KLAVE_BETA_DOMAIN_FILTER']?.split(',') ?? [];
            const emailDomain = hint.domain;

            if (!emailDomain || (betaDomainsAllowed.length > 0 && !betaDomainsAllowed.includes(emailDomain)))
                throw new Error('It looks like you are not part of Klave\'s beta program');

            const user = await prisma.user.findFirst({
                where: {
                    emails: {
                        has: email
                    }
                },
                select: {
                    id: true
                }
            });

            if (!rpID)
                setWebauthnPrimitives();

            const options = await generateRegistrationOptions({
                rpName: 'Klave',
                rpID,
                // We pretend we found a user with this email address
                // TODO - Ensure we compute a fake UUID not based on email to avoid revealing registration status
                userID: user?.id ?? String(await webcrypto.subtle.digest('SHA-256', Buffer.from(email))),
                userName: email,
                timeout: 60000,
                // Don't prompt users for additional information about the authenticator
                // (Recommended for smoother UX)
                attestationType: 'none',
                /**
                     * Passing in a user's list of already-registered authenticator IDs here prevents users from
                     * registering the same device multiple times. The authenticator will simply throw an error in
                     * the browser if it's asked to perform registration when one of these ID's already resides
                     * on it.
                     */
                // excludeCredentials: user.devices.map(dev => ({
                //     id: Buffer.from(dev.credentialID),
                //     type: 'public-key',
                //     transports: dev.transports
                // })),
                authenticatorSelection: {
                    residentKey: 'discouraged'
                },
                // Support the two most common algorithms: ES256, and RS256
                supportedAlgorithmIDs: [-7, -257]
            });

            if (user)
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        webauthChallenge: options.challenge,
                        webauthChallengeCreatedAt: new Date()
                    }
                });

            return options;
        }),
    registerWebauthn: publicProcedure
        .input(z.object({
            email: z.string(),
            data: z.custom<Awaited<ReturnType<typeof startRegistration>>>()
        }))
        .mutation(async ({ ctx: { prisma, session, sessionStore }, input: { email, data } }) => {

            const user = await prisma.user.findFirst({
                where: {
                    emails: {
                        has: email
                    }
                },
                select: {
                    id: true,
                    slug: true,
                    webauthChallenge: true,
                    createdOrganisations: {
                        where: {
                            personal: {
                                equals: true
                            }
                        },
                        select: {
                            id: true
                        }
                    }
                }
            });

            if (!rpID)
                setWebauthnPrimitives();

            const { verified, registrationInfo } = await verifyRegistrationResponse({
                response: data,
                expectedChallenge: `${user?.webauthChallenge}`,
                expectedOrigin: origin,
                expectedRPID: rpID
            });


            if (!verified || !registrationInfo)
                return {
                    ok: false,
                    error: 'Invalid registration response'
                };

            const { credentialPublicKey, credentialID, counter } = registrationInfo;

            if (user) {
                await prisma.webauthCredential.create({
                    data: {
                        user: {
                            connect: {
                                id: user.id
                            }
                        },
                        credentialPublicKey: Utils.toBase64(credentialPublicKey, true),
                        credentialID: Utils.toBase64(credentialID, true),
                        counter
                    }
                });

                await new Promise<void>((resolve, reject) => {
                    session.save(() => {
                        sessionStore.set(session.id, {
                            ...session,
                            user: {
                                id: user.id,
                                slug: user.slug,
                                personalOrganisationId: user.createdOrganisations[0]?.id
                            }
                        }, (err) => {
                            if (err)
                                reject(err);
                            resolve();
                        });
                    });
                });

                return {
                    ok: true
                };
            }

            return {
                ok: false,
                error: 'Invalid registration response'
            };
        }),
    logOut: publicProcedure.mutation(async ({ ctx: { session } }) => {
        await new Promise<void>((resolve, reject) => {
            session.destroy((err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
        return {
            ok: true
        };
    })
});

export default authRouter;