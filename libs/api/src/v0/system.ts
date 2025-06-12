import { scpOps } from '@klave/providers';
import { createTRPCRouter, publicProcedure } from '../trpc';
import z from 'zod';
import { config } from '@klave/constants';

export const systemRouter = createTRPCRouter({
    isSystemReady: publicProcedure
        .query(async ({ ctx: { prisma, sessionID } }) => {
            const isDBAlive = await prisma.session.findUnique({ where: { id: sessionID } });
            const isSecretariumAlive = scpOps.isConnected();
            return isSecretariumAlive && !!isDBAlive;
        }),
    getSecretariumNode: publicProcedure
        .query(async () => {
            return config.get('KLAVE_SECRETARIUM_NODE');
        }),
    getUIHostingDomain: publicProcedure
        .query(async () => {
            return config.get('KLAVE_BHDUI_DOMAIN');
        }),
    getStripeKey: publicProcedure
        .query(async () => {
            return config.get('KLAVE_STRIPE_PUB_KEY');
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
                        console.error(e?.toString());
                        env[key] = '***';
                    }
                    return;
                }
                if (normKey.includes('SECRET') || normKey.includes('KEY') || normKey.includes('TOKEN')) {
                    if (['KLAVE_SECRETARIUM_NODE'].includes(normKey))
                        return;
                    env[key] = normValue.substring(0, 10) + '***';
                }
            });
            return env;
        }),
    setConfigurationVariable: publicProcedure
        .input(z.object({
            name: z.string(),
            value: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input }) => {
            if (user?.globalAdmin !== true)
                return false;
            if (input.name === 'KLAVE_MONGODB_URL'
                || input.name === 'KLAVE_PROBOT_APPID'
                || input.name === 'NODE_ENV'
                || input.name === 'NODE'
                || input.name === 'HOSTNAME'
            )
                return false;
            await prisma.environment.updateMany({
                where: { name: input.name },
                data: { value: input.value }
            });
            return true;
        }),
    version: publicProcedure
        .query(async () => {
            return {
                version: config.get('GIT_REPO_VERSION'),
                git: {
                    commit: config.get('GIT_REPO_COMMIT'),
                    branch: config.get('GIT_REPO_BRANCH'),
                    dirty: config.get('GIT_REPO_DIRTY')
                },
                secretarium: scpOps.version()
            };
        })
});

export default systemRouter;