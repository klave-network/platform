import { prisma } from '@klave/db';
import { logger } from './logger';

export const envOps = {
    initialize: async () => {
        logger.info('Initializing environment variables');
        const env = await prisma.environment.findMany();
        env.forEach(e => {
            if (e.value?.length ?? 0 > 0)
                process.env[e.name] = e.value ?? undefined;
        });
        if (process.env['KLAVE_LOAD_ENV'] === 'true')
            await Promise.all(Object.entries(process.env).map(async ([key, value]) => {
                if (key.startsWith('KLAVE_') ||
                    key.startsWith('KLAVE_SECRETARIUM_') ||
                    key.startsWith('KLAVE_GITHUB_') ||
                    key.startsWith('KLAVE_') ||
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
    }
};