import os from 'node:os';
import { prisma } from '@klave/db';
import { logger } from './logger';

export const envOps = {
    initialize: async () => {
        logger.info('Initializing environment variables');
        const env = await prisma.environment.findMany();
        env.sort((a, b) => a.name.localeCompare(b.name)).forEach(e => {
            if ((e.value?.length ?? 0) > 0) {
                process.env[e.name] = e.value ?? undefined;
                logger.info(`  - ${e.name} = ${e.name.toUpperCase().includes('SECRET') ? '***' : (e.value?.length ?? 0) > 42 ? `${e.value?.substring(0, 42)}...` : e.value}`);
            }
        });
        if (process.env['KLAVE_LOAD_ENV'] === 'true')
            await Promise.all(Object.entries(process.env).map(async ([key, value]) => {
                if (!value)
                    return;
                if (key.startsWith('KLAVE_') ||
                    key.startsWith('KLAVE_SECRETARIUM_') ||
                    key.startsWith('KLAVE_GITHUB_') ||
                    key.startsWith('SECRETARIUM_') ||
                    key.startsWith('GITHUB_'))
                    if ((await prisma.environment.findMany({
                        where: {
                            name: key
                        }
                    })).length === 0) {
                        await prisma.environment.create({
                            data: {
                                name: key,
                                value: value
                            }
                        });
                    }
            }));
        if (!process.env['HOSTNAME'] || process.env['HOSTNAME'] === 'unknown')
            process.env['HOSTNAME'] = os.hostname() ?? 'unknown';
    }
};