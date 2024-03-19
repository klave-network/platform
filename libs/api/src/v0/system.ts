import { scpOps } from '@klave/providers';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const systemRouter = createTRPCRouter({
    isSystemReady: publicProcedure
        .query(async ({ ctx: { prisma, sessionID } }) => {
            const isDBAlive = await prisma.session.findUnique({ where: { id: sessionID } });
            const isSecretariumAlive = scpOps.isConnected();
            return isSecretariumAlive && !!isDBAlive;
        }),
    getSecretariumNode: publicProcedure
        .query(async () => {
            return process.env['KLAVE_SECRETARIUM_NODE'];
        }),
    getRunningConfiguration: publicProcedure
        .query(async ({ ctx: { session: { user } } }) => {
            if (user?.globalAdmin !== true)
                return {};
            return { ...process.env } as Record<string, string>;
        }),
    version: publicProcedure
        .query(async () => {
            return {
                version: process.env['GIT_REPO_VERSION'],
                git: {
                    commit: process.env['GIT_REPO_COMMIT'],
                    branch: process.env['GIT_REPO_BRANCH'],
                    dirty: process.env['GIT_REPO_DIRTY']
                },
                secretarium: scpOps.version()
            };
        })
});

export default systemRouter;