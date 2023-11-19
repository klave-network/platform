import { prisma } from '@klave/db';
import { router } from '@klave/api';
import { logger, scp, scpOps } from '@klave/providers';

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

    selectTargets.forEach(({ fqdn }) => {
        (async () => {
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
                await Promise.allSettled(sortedDeployments.map(async (deployment) => {
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
        })()
            .catch(() => { return; });
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
    return Promise.allSettled(expiredDeploymentList.map(async (deployment) => {
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
    return Promise.allSettled(expiredDeploymentList.map(async (deployment) => {
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function reconcileApplicationKredits() {

    const applicationsWithDeployments = await prisma.application.findMany({
        where: {
            deployments: {
                some: {
                    status: {
                        in: ['deployed']
                    }
                }
            }
        }
    });

    return Promise.allSettled(applicationsWithDeployments.map(async (application) => {
        return new Promise((resolve, reject) => {
            if (!scpOps.isConnected())
                return reject('Secretarium is not connected');
            new Promise<unknown>((resolve, reject) => {
                scp.newTx('wasm-manager', 'get_kredit', `klave-app-get-kredit-${application.id}`, {
                    app_id: application.id
                }).onResult((result: any) => {
                    resolve(result);
                }).onError((error: any) => {
                    reject(error);
                }).send().catch(reject);
            })
                .then((kredits) => {
                    if (!kredits)
                        reject('No credits returned');
                    const { kredit } = kredits as any;
                    logger.debug(`Reconciling application ${application.id} with ${kredit} kredits`);
                    prisma.application.update({
                        where: {
                            id: application.id
                        },
                        data: {
                            kredits: kredit
                        }
                    }).then(resolve).catch(reject);
                })
                .catch(reject);
        });
    })).catch((e) => {
        logger.error('Error while reconciling application credit allications', e);
    });
}

export async function prune() {
    try {
        await errorLongDeployingDeployments();
        await terminateExpiredDeployments();
        await cleanDisconnectedDeployments();
        await cancelUpdatingDeployments();
        // await reconcileApplicationKredits();
    } catch (e) {
        logger.error('Error while pruning', e);
    }
}

type PrunerOptions = {
    interval?: number;
}

export function startPruner(options?: PrunerOptions) {
    const { interval = 6000 } = options ?? {};
    prune().catch(() => { return; });
    intervalTimer = setInterval(() => {
        prune().catch(() => { return; });
    }, interval);
}

export function stopPruner() {
    clearInterval(intervalTimer);
}