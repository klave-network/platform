// import i18n from '../i18n';
import { logger } from '@klave/providers';
import { prisma } from '@klave/db';
import { config } from '@klave/constants';

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
            const sanitizedUrl = config.get('KLAVE_MONGODB_URL')?.replace(/\/\/.*@/, '//***@');
            logger.info(`Connected to Mongo via Prisma ${sanitizedUrl}`);
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
            console.error(e?.toString());
        }
    }
};

export default client;