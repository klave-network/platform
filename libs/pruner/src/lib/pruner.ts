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

async function cleanDisconnectedDeployments() {

    const selectTargets = await prisma.deploymentAddress.groupBy({
        by: ['fqdn'],
        having: {
            fqdn: {
                _count: {
                    gt: 1
                }
            }
        }
    });

    selectTargets.forEach(async ({ fqdn }) => {
        const deploymentsList = await prisma.deployment.findMany({
            where: {
                status: {
                    in: ['deployed']
                },
                // TODO Check this is the correct behaviour for long lived deployments
                life: 'short',
                deploymentAddress: {
                    fqdn
                }
            },
            select: {
                id: true,
                createdAt: true
            }
        });
        if (deploymentsList.length > 1) {
            const sortedDeployments = deploymentsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            await Promise.allSettled(sortedDeployments.map((deployment) => {
                const caller = router.v0.deployments.createCaller({
                    prisma,
                    session: {},
                    override: '__system_pruner_cleaner'
                } as any);
                return caller.delete({
                    deploymentId: deployment.id
                });
            })).catch((e) => {
                logger.error('Error while cleaning leaf deployments ', e);
            });
        }
    });

}

async function terminateExpiredDeployments() {
    const expiredDeploymentList = await prisma.deployment.findMany({
        where: {
            status: {
                in: ['deployed', 'errored']
            },
            life: 'short',
            expiresOn: {
                lt: new Date()
            }
        }
    });
    return Promise.allSettled(expiredDeploymentList.map((deployment) => {
        const caller = router.v0.deployments.createCaller({
            prisma,
            session: {},
            override: '__system_pruner_terminator'
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

async function cancelUpdatingDeployments() {

    const expiredDeploymentList = await prisma.deployment.findMany({
        where: {
            status: {
                in: ['updating']
            },
            updatedAt: {
                lt: new Date(Date.now() - 1000 * 60 * 10)
            }
        }
    });
    return Promise.allSettled(expiredDeploymentList.map((deployment) => {
        return prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: 'deployed'
            }
        });
    })).catch((e) => {
        logger.error('Error while rolling back updating deployments', e);
    });
}

export async function prune() {
    try {
        await errorLongDeployingDeployments();
        await terminateExpiredDeployments();
        await cleanDisconnectedDeployments();
        await cancelUpdatingDeployments();
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