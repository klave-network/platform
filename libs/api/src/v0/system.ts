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
            const env = { ...process.env } as Record<string, string>;
            Object.keys(env).forEach((key) => {
                const normKey = key.toLocaleUpperCase();
                const normValue = env[key];
                if (!normKey.startsWith('KLAVE') && !normKey.startsWith('NODE') && !normKey.startsWith('HOSTNAME')) {
                    delete env[key];
                    return;
                }
                if (!normValue) {
                    env[key] = '***';
                    return;
                }
                if ((normKey === 'KLAVE_MONGODB_URL' || normKey === 'KLAVE_SMTP_HOST') && normValue) {
                    try {
                        const url = new URL(normValue);
                        env[key] = url.protocol + '//' + url.host + url.pathname;
                    } catch (e) {
                        env[key] = '***';
                    }
                    return;
                }
                if (normKey.includes('SECRET') || normKey.includes('KEY') || normKey.includes('TOKEN')) {
                    if (['KLAVE_SECRETARIUM_NODE'].includes(normKey))
                        return;
                    env[key] = normValue.substring(0, 10) + '***';
                    return;
                }
            });
            return env;
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