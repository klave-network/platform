// import i18n from '../i18n';
import { logger } from '@klave/providers';
import { prisma } from '@klave/db';

export const client = prisma;

let reconnectAttempt = 0;
let reconnectionTimeout: NodeJS.Timeout | undefined;

const planReconnection = async () => {
    return new Promise((resolve) => {
        if (!reconnectionTimeout) {
            reconnectionTimeout = setTimeout(() => {
                clearTimeout(reconnectionTimeout);
                reconnectionTimeout = undefined;
                dbOps.initialize().then(resolve).catch(() => { return; });
            }, 3000);
        }
    });
};

export const dbOps = {
    initialize: async () => {
        try {
            await client.$connect();
            await client.$runCommandRaw({
                count: 'deployment'
            });
            logger.info(`Connected to Mongo via Prisma ${process.env['KLAVE_MONGODB_URL']}`);
            reconnectAttempt = 0;
            return;
        } catch (error: unknown) {
            const e = error as Error & { code?: number, meta?: { message?: string } };
            logger.error(`Connection ${++reconnectAttempt} to Mongo failed: ${e?.meta?.message ?? e?.message ?? e?.code ?? 'Unknown error'}}`);
            await planReconnection();
        }
    },
    stop: async () => {
        try {
            await client.$disconnect();
            return;
        } catch (e) {
            //
        }
    }
};

export default client;