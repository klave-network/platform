import { prisma } from '@klave/db';
import { router } from '@klave/api';
import { logger } from '@klave/providers';

let intervalTimer: NodeJS.Timeout;

async function errorLongDeployingDeployments() {
    return prisma.deployment.updateMany({
        where: {
            status: {
                // TODO Figure out what to with failing termination
                in: ['created', 'compiled', 'deploying', 'terminating']
            },
            updatedAt: {
                lt: new Date(Date.now() - 1000 * 60 * 5)
            }
        },
        data: {
            status: 'errored',
            buildOutputErrorObj: {
                message: 'Deployment timed out'
            }
        }
    }).catch((e) => {
        logger.error('Error while updating long deploying deployments', e);
    });
}

async function terminateExpiredDeployments() {
    const expiredDeploymentList = await prisma.deployment.findMany({
        where: {
            status: {
                in: ['deployed', 'errored']
            },
            expiresOn: {
                lt: new Date()
            }
        }
    });
    return Promise.allSettled(expiredDeploymentList.map((deployment) => {
        const caller = router.v0.deployments.createCaller({
            prisma
        } as any);
        if (deployment.status === 'deployed')
            return caller.terminateDeployment({
                deploymentId: deployment.id
            });
        return caller.delete({
            deploymentId: deployment.id
        });
    })).catch((e) => {
        logger.error('Error while terminating expired deployments', e);
    });
}

export async function prune() {
    try {
        await errorLongDeployingDeployments();
        await terminateExpiredDeployments();
    } catch (e) {
        logger.error('Error while pruning', e);
    }
}

type PrunerOptions = {
    interval?: number;
}

export function startPruner(options?: PrunerOptions) {
    const { interval = 6000 } = options ?? {};
    prune();
    intervalTimer = setInterval(() => {
        prune();
    }, interval);
}

export function stopPruner() {
    clearInterval(intervalTimer);
}