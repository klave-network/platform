import { prisma } from '@klave/db';
import { Context, createCallerFactory, router } from '@klave/api';
import { logger, scp, scpOps } from '@klave/providers';
import { config, KlaveGetCreditResult } from '@klave/constants';
import { migrateDBFields } from './migrate-db';

let intervalTimer: NodeJS.Timeout;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

async function __unusedErrorLongDeployingDeployments() {
    return prisma.deployment.updateMany({
        where: {
            deletedAt: {
                isSet: false
            },
            status: {
                // TODO Figure out what to with failing termination
                in: ['created', 'compiling', 'compiled', 'deploying', 'terminating']
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

async function __unusedCleanDisconnectedDeployments() {

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
                    deletedAt: {
                        isSet: false
                    },
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
                    const createCaller = createCallerFactory(router);
                    const caller = createCaller({
                        prisma,
                        session: {},
                        override: '__system_pruner_cleaner'
                    } as unknown as Context);
                    return caller.v0.deployments.delete({
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

async function __unusedTerminateExpiredDeployments() {
    const expiredDeploymentList = await prisma.deployment.findMany({
        where: {
            deletedAt: {
                isSet: false
            },
            status: {
                in: ['deployed', 'errored']
            },
            life: 'short',
            expiresOn: {
                lt: new Date()
            }
        },
        select: {
            id: true,
            status: true,
            createdAt: true
        }
    });
    return Promise.allSettled(expiredDeploymentList.map(async (deployment) => {
        const createCaller = createCallerFactory(router);
        const caller = createCaller({
            prisma,
            session: {},
            override: '__system_pruner_terminator'
        } as unknown as Context);
        if (deployment.status === 'deployed')
            return caller.v0.deployments.terminateDeployment({
                deploymentId: deployment.id
            });
        return caller.v0.deployments.delete({
            deploymentId: deployment.id
        });
    })).catch((e) => {
        logger.error('Error while terminating expired deployments', e);
    });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

async function __unusedCancelUpdatingDeployments() {

    const expiredDeploymentList = await prisma.deployment.findMany({
        where: {
            deletedAt: {
                isSet: false
            },
            status: {
                in: ['updating']
            },
            updatedAt: {
                lt: new Date(Date.now() - 1000 * 60 * 10)
            }
        },
        select: {
            id: true
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

async function __unusedReconcileApplicationKredits() {

    const applicationsWithDeployments = await prisma.application.findMany({
        where: {
            deletedAt: {
                isSet: false
            },
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
            scp.newTx<KlaveGetCreditResult>(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit', `klave-app-get-kredit-${application.id}`, {
                app_id: application.id
            }).onResult((result) => {
                resolve(result);
            }).onError((error) => {
                reject(error);
            }).send().then((kredits) => {
                if (!kredits)
                    return reject('No credits returned');
                const { kredit } = kredits;
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
        await migrateDBFields();
        // await errorLongDeployingDeployments();
        // await terminateExpiredDeployments();
        // await cleanDisconnectedDeployments();
        // await cancelUpdatingDeployments();
        // await reconcileApplicationKredits();
        // await reconcileApplicationLimits();
    } catch (e) {
        logger.error('Error while pruning', e);
    }
}

type PrunerOptions = {
    interval?: number;
};

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