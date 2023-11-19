import { RequestHandler } from 'express-serve-static-core';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { Web, prisma } from '@klave/db';
import { v4 as uuid } from 'uuid';
import { logger } from '@klave/providers';

export const webLinkerMiddlware: RequestHandler = (req, __unusedRes, next) => {

    (async () => {

        const { headers, session } = req;
        const ephemeralTag = headers['x-trustless-klave-ephemeral-tag']?.toString();

        try {

            await new Promise(resolve => session.save(resolve));

            const webs = await prisma.web.findMany({
                include: {
                    sessions: true,
                    deployableRepos: true,
                    applications: true
                },
                where: {
                    deletedAt: {
                        isSet: false
                    },
                    OR: [{
                        userId: session.user?.id
                    }, {
                        sessions: {
                            some: {
                                sid: session.id
                            }
                        }
                    }, {
                        ephemerals: ephemeralTag ? {
                            has: ephemeralTag
                        } : undefined
                    }]
                }
            });

            let currentWeb: Web;
            if (webs[0]) {

                currentWeb = webs[0];

                // try {
                //     await prisma.web.update({
                //         where: {
                //             id: currentWeb.id
                //         },
                //         data: {
                //             sessions: {
                //                 connect: {
                //                     sid: session.id
                //                 }
                //             }
                //         }
                //     });
                // } catch (e) {
                //     logger.error(`Failed to connect session ${session.id} to web ${currentWeb.id}`);
                // }

            } else {

                logger.info(`Composing web from ${webs.length} existing entities`);

                const setOfWebId = new Set<string>();
                const setOfSessionId = new Set<string>([session.id]);
                const setOfEphemeralId = new Set<string>(ephemeralTag ? [ephemeralTag] : []);
                const setOfDeployableRepos = new Set<string>();
                const setOfApplications = new Set<string>();
                let githubToken: typeof webs[number]['githubToken'] = null;
                let userId: typeof webs[number]['userId'] | undefined = undefined;

                webs.forEach(web => {
                    setOfWebId.add(web.id);
                    web.sessions.map(s => s.sid).forEach(s => setOfSessionId.add(s));
                    web.ephemerals.forEach(e => setOfEphemeralId.add(e));
                    web.deployableRepos.map(d => d.id).forEach(d => setOfDeployableRepos.add(d));
                    web.applications.map(a => a.id).forEach(a => setOfApplications.add(a));
                    if (web.githubToken && (!githubToken || githubToken.createdAt.getTime() < web.githubToken.createdAt.getTime()))
                        githubToken = web.githubToken;
                    if (web.userId)
                        userId = web.userId;
                });

                currentWeb = await prisma.web.create({
                    include: {
                        sessions: true,
                        deployableRepos: true,
                        applications: true
                    },
                    data: {
                        id: uuid(),
                        name: uniqueNamesGenerator({
                            dictionaries: [adjectives, colors, animals],
                            separator: '-'
                        }),
                        ancestors: Array.from(setOfWebId),
                        user: userId ? {
                            connect: {
                                id: userId
                            }
                        } : {},
                        sessions: {
                            connect: Array.from(setOfSessionId).map(sid => ({ sid }))
                        },
                        ephemerals: Array.from(setOfEphemeralId),
                        deployableRepos: {
                            connect: Array.from(setOfDeployableRepos).map(did => ({ id: did }))
                        },
                        applications: {
                            connect: Array.from(setOfApplications).map(aid => ({ id: aid }))
                        },
                        githubToken
                    }
                });

                await prisma.web.updateMany({
                    where: {
                        id: {
                            in: currentWeb.ancestors
                        }
                    },
                    data: {
                        deletedAt: new Date()
                    }
                });
            }

            req.web = currentWeb;
            req.webId = currentWeb.id;

        } catch (e) {
            console.error(e);
        }

        next();
    })()
        .catch(() => { return; });
};