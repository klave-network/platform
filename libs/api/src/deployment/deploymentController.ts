import { DeploymentPushPayload } from '../types';
import { v4 as uuid } from 'uuid';
import * as Sentry from '@sentry/node';
import { scp, scpOps, logger } from '@klave/providers';
import { Deployment, prisma, DeploymentAddress, Commit, CommitVerificationReason } from '@klave/db';
import { SCP, Utils } from '@secretarium/connector';
import * as path from 'node:path';
import prettyBytes from 'pretty-bytes';
import BuildMiniVM, { DeploymentContext } from './buildMiniVm';
import { router } from '../router';
import { Context } from '../context';
import { config, getFinalParseConfig } from '@klave/constants';
import { createCallerFactory } from '../trpc';

export const deployToSubstrate = async (deploymentContext: DeploymentContext<DeploymentPushPayload>, options?: { onlyApp?: string }) => {

    const { octokit, ...context } = deploymentContext;
    let files: NonNullable<Awaited<ReturnType<typeof octokit.rest.repos.compareCommits>>['data']['files']> = [];
    let commit: Commit | null = null;

    if (context.commit.before) {
        try {
            const { data } = await octokit.rest.repos.compareCommits({
                owner: context.repo.owner,
                repo: context.repo.name,
                base: context.commit.before,
                head: context.commit.after
            });

            const commitData = data.commits.pop();
            if (commitData)
                commit = {
                    source: 'github',
                    author: commitData.author?.name ?? commitData.committer?.name ?? null,
                    message: commitData.commit.message,
                    sha: commitData.sha,
                    date: new Date(commitData.commit.committer?.date ?? Date.now()),
                    parents: commitData.parents.map(parent => parent.sha),
                    verification: {
                        verified: commitData.commit.verification?.verified ?? false,
                        reason: (commitData.commit.verification?.reason ?? 'unknown') as CommitVerificationReason,
                        signature: commitData.commit.verification?.signature ?? null,
                        payload: commitData.commit.verification?.payload ?? null
                    }
                };

            if (data.files)
                files = data.files;

        } catch (e) {
            logger.debug('Error while comparing files from github', e);
        }
    }

    if (!files?.length) {
        try {
            const { data } = await octokit.rest.repos.getCommit({
                owner: context.repo.owner,
                repo: context.repo.name,
                ref: context.commit.after
            });

            commit = {
                source: 'github',
                author: data.author?.name ?? data.committer?.name ?? null,
                message: data.commit.message,
                sha: data.sha,
                date: new Date(data.commit.committer?.date ?? Date.now()),
                parents: data.parents.map(parent => parent.sha),
                verification: {
                    verified: data.commit.verification?.verified ?? false,
                    reason: (data.commit.verification?.reason ?? 'unknown') as CommitVerificationReason,
                    signature: data.commit.verification?.signature ?? null,
                    payload: data.commit.verification?.payload ?? null
                }
            };

            if (data.files)
                files = data.files;
        } catch (e) {
            logger.error('Error while fetching files from github', e);
        }
    }

    if (!files.length && !context.forceDeploy)
        return;

    const repo = await prisma.repo.findUnique({
        include: {
            applications: {
                where: {
                    deletedAt: {
                        isSet: false
                    }
                },
                include: {
                    organisation: true
                }
            }
        },
        where: {
            source_owner_name: {
                source: 'github',
                name: context.repo.name,
                owner: context.repo.owner
            }
        }
    });

    if (!repo)
        return;

    const klaveConfigurationResponse = await octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        ref: context.commit.ref,
        path: 'klave.json',
        mediaType: {
            format: 'raw+json'
        }
    });

    const klaveConfigurationData = Array.isArray(klaveConfigurationResponse.data) ? klaveConfigurationResponse.data[0] : klaveConfigurationResponse.data;

    if (!klaveConfigurationData)
        return;

    let klaveConfiguration: ReturnType<typeof getFinalParseConfig> | null = null;
    try {
        klaveConfiguration = getFinalParseConfig(klaveConfigurationData.toString());
    } catch (e) {
        logger.error('Error while parsing klave.json', e);
        return;
    }

    if (!klaveConfiguration || !klaveConfiguration.success)
        return;

    const availableApplicationsConfig = klaveConfiguration.data.applications?.reduce((prev, current) => {
        prev[current.slug] = current;
        return prev;
    }, {} as Record<string, (NonNullable<typeof klaveConfiguration.data['applications']>[number])>) ?? {};

    repo.applications.forEach(application => {

        (async () => {

            if (options?.onlyApp && options.onlyApp !== application.id)
                return;

            // Bail out if the application is not in the running configuration
            if (!availableApplicationsConfig[application.slug])
                return;

            // TODO There is typing error in this location
            const fileChanged = files.filter(({ filename }) => {
                const commitFileDir = path.normalize(path.join('/', filename));
                const appPath = path.normalize(path.join('/', availableApplicationsConfig[application.slug]?.rootDir ?? ''));
                return commitFileDir.startsWith(appPath) || filename === 'klave.json';
            });

            if (fileChanged.length === 0 && !context.forceDeploy)
                return;

            logger.info(`Deploying ${application.slug} from ${context.commit.after}`);

            await prisma.activityLog.create({
                data: {
                    class: 'pushHook',
                    application: {
                        connect: {
                            id: application.id
                        }
                    },
                    context: {
                        type: context.type,
                        payload: {
                            ...context,
                            headCommit: commit
                        }
                    }
                }
            });

            if (application.gitSignRequired && !commit?.verification?.verified)
                return;

            const launchDeploy = async () => {

                const branchName = (context.commit.ref?.includes('/') ? context.commit.ref.split('/').pop() : repo.defaultBranch) ?? 'master';
                const buildId = context.commit.after.substring(0, 8);
                const domains = await prisma.domain.findMany({
                    where: {
                        applicationId: application.id,
                        verified: true
                    }
                });

                const deploymentSet = uuid();
                const sanitizedBranchName = branchName.replace(/[^a-z0-9-]/g, '-').toLowerCase();
                const targets = domains
                    .map(domain => `${sanitizedBranchName}.${application.id.split('-')[0]}.${application.slug}.${domain.fqdn}`)
                    .concat(...[
                        `${sanitizedBranchName}.${application.id.split('-')[0]}.${application.slug}.${application.organisation.slug.replace('~$~', '')}.klave.network`,
                        application.deployCommitLedgers ? `${buildId}.${application.id.split('-')[0]}.${application.slug}.${application.organisation.slug.replace('~$~', '')}.klave.network` : undefined
                    ].filter(Boolean));

                targets.forEach(target => {

                    (async () => {

                        let contextualDeploymentId: string | undefined;

                        try {
                            const previousDeployment = await prisma.deployment.findFirst({
                                where: {
                                    deletedAt: {
                                        isSet: false
                                    },
                                    deploymentAddress: {
                                        fqdn: target
                                    },
                                    status: {
                                        not: 'errored'
                                    }
                                },
                                include: {
                                    deploymentAddress: true
                                }
                            });

                            if (previousDeployment)
                                await prisma.deployment.update({
                                    where: {
                                        id: previousDeployment.id
                                    },
                                    data: {
                                        status: 'updating'
                                    }
                                });

                            const deployment = await prisma.deployment.create({
                                data: {
                                    deploymentAddress: {
                                        create: {
                                            fqdn: target
                                        }
                                    },
                                    commit,
                                    expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                                    version: availableApplicationsConfig[application.slug]?.version,
                                    set: deploymentSet,
                                    build: context.commit.after.substring(0, 8),
                                    branch: branchName,
                                    locations: ['FR'],
                                    application: {
                                        connect: { id: application.id }
                                    },
                                    configSnapshot: klaveConfiguration.data
                                    // TODO: Make sure we get the push event
                                    // pushEvent
                                }
                            });

                            contextualDeploymentId = deployment.id;

                            logger.debug(`Starting compilation ${deployment.id} for target ${target}...`, {
                                parent: 'dpl'
                            });

                            await prisma.activityLog.create({
                                data: {
                                    class: 'deployment',
                                    application: {
                                        connect: {
                                            id: application.id
                                        }
                                    },
                                    context: {
                                        type: 'start',
                                        payload: {
                                            deploymentId: deployment.id
                                        }
                                    }
                                }
                            });

                            const CompletionPollingInterval = setInterval(() => {

                                (async () => {

                                    logger.debug(`Checking on deployment ${deployment.id} for completion...`, {
                                        parent: 'dpl'
                                    });
                                    const currentState = await prisma.deployment.findUnique({
                                        where: {
                                            id: deployment.id
                                        },
                                        select: {
                                            id: true,
                                            status: true,
                                            updatedAt: true
                                        }
                                    });

                                    if (!currentState) {
                                        logger.debug(`Deployment ${deployment.id} is no longer available`, {
                                            parent: 'dpl'
                                        });
                                        clearInterval(CompletionPollingInterval);
                                        return;
                                    }

                                    if (currentState.status === 'deployed' || currentState.status === 'errored') {
                                        logger.debug(`Deployment ${deployment.id} already completed`, {
                                            parent: 'dpl'
                                        });
                                        clearInterval(CompletionPollingInterval);
                                        return;
                                    }

                                    const timeSinceLastUpdate = currentState.updatedAt ? Date.now() - currentState.updatedAt.getTime() : 0;

                                    logger.debug(`Deployment ${deployment.id} updated ${timeSinceLastUpdate / 1000}s ago`, {
                                        parent: 'dpl'
                                    });

                                    if (timeSinceLastUpdate > 1000 * 60) {
                                        logger.debug(`Deployment ${deployment.id} timed out`, {
                                            parent: 'dpl'
                                        });
                                        if (previousDeployment) {
                                            await prisma.deployment.update({
                                                where: {
                                                    id: previousDeployment.id
                                                },
                                                data: {
                                                    status: previousDeployment.status
                                                }
                                            }).catch((reason) => {
                                                logger.debug(`Error while updating previous deployment ${previousDeployment.id} status`, {
                                                    parent: 'dpl',
                                                    reason
                                                });
                                            });
                                        }
                                        await prisma.deployment.update({
                                            where: {
                                                id: deployment.id
                                            },
                                            data: {
                                                status: 'errored',
                                                buildOutputStdErr: 'Deployment timed out'
                                            }
                                        }).catch((reason) => {
                                            logger.debug('Error while updating deployment status to error', {
                                                parent: 'dpl',
                                                reason
                                            });
                                        });
                                    }
                                })().catch((error) => {
                                    logger.debug('Error while updating deployment status to error', {
                                        parent: 'dpl',
                                        error
                                    });
                                    clearInterval(CompletionPollingInterval);
                                });

                            }, 1000 * 60);

                            const applicationObject = availableApplicationsConfig[application.slug];

                            const buildVm = new BuildMiniVM({
                                type: 'github',
                                context: deploymentContext,
                                repo,
                                application: applicationObject,
                                deployment
                            });

                            await prisma.deployment.update({
                                where: {
                                    id: deployment.id
                                },
                                data: {
                                    status: 'compiling'
                                }
                            });

                            const buildResult = await buildVm.build();
                            const { stdout, stderr, dependenciesManifest } = buildResult;

                            await prisma.deployment.update({
                                where: {
                                    id: deployment.id
                                },
                                data: {
                                    dependenciesManifest,
                                    sourceType: buildResult.sourceType,
                                    buildOutputStdOut: stdout,
                                    buildOutputStdErr: stderr
                                }
                            });

                            // TODO - Populate reasons why deployment failed
                            if (buildResult.success === false) {
                                logger.debug('Compilation failed', {
                                    parent: 'dpl'
                                });
                                await prisma.deployment.update({
                                    where: {
                                        id: deployment.id
                                    },
                                    data: {
                                        status: 'errored',
                                        buildOutputs: buildResult.buildOutputs,
                                        buildOutputErrorObj: buildResult.error as NonNullable<object> ?? null
                                    }
                                });
                                return;
                            }

                            const { result: { wasm, wat, dts, routes, hasUI } } = buildResult;
                            const wasmB64 = Utils.toBase64(wasm);

                            logger.debug(`Compilation was successful ${deployment.id} (${prettyBytes(wasmB64.length)})`, {
                                parent: 'dpl'
                            });

                            // TODO - Populate reasons we fail on empty wasm
                            if (wasm.length === 0) {
                                logger.debug('Empty wasm', {
                                    parent: 'dpl'
                                });
                                await prisma.deployment.update({
                                    where: {
                                        id: deployment.id
                                    },
                                    data: {
                                        status: 'errored',
                                        buildOutputs: buildResult.buildOutputs,
                                        buildOutputErrorObj: { message: 'Empty wasm' }
                                    }
                                });
                                return;
                            }

                            await prisma.deployment.update({
                                where: {
                                    id: deployment.id
                                },
                                data: {
                                    status: 'compiled',
                                    buildOutputs: buildResult.buildOutputs,
                                    buildOutputWASM: wasmB64,
                                    buildOutputWAT: wat,
                                    buildOutputDTS: dts,
                                    buildOutputRoutes: routes,
                                    buildOutputHasUI: hasUI
                                }
                            });

                            if (routes.length) {
                                await prisma.deployment.update({
                                    where: {
                                        id: deployment.id
                                    },
                                    data: {
                                        contractFunctions: routes
                                    }
                                });
                            }

                            await prisma.deployment.update({
                                where: {
                                    id: deployment.id
                                },
                                data: {
                                    status: 'deploying'
                                }
                            });

                            await sendToSecretarium({
                                deployment,
                                wasmB64,
                                target,
                                targetCluster: klaveConfiguration.data.targetCluster,
                                previousDeployment
                            });

                        } catch (errorIn) {
                            let error = errorIn;
                            logger.debug(`Deployment failure for ${target}: ${errorIn}`);
                            if (error instanceof Error) {
                                error = {
                                    message: error.message,
                                    stack: config.get('NODE_ENV') === 'development' ? error.stack : undefined
                                };
                            }
                            try {
                                if (contextualDeploymentId)
                                    await prisma.deployment.update({
                                        where: {
                                            id: contextualDeploymentId
                                        },
                                        data: {
                                            status: 'errored',
                                            buildOutputErrorObj: error ?? ((error as unknown)?.toString ? { message: `${error}` } : null)
                                        }
                                    });
                            } catch (error) {
                                logger.debug(`General failure processing ${target}: ${error}`);
                                // Timeout will eventually error this
                            }
                        }
                    })()
                        .catch(() => { return; });
                });
            };

            if (context.class === 'push')
                launchDeploy()
                    .finally(() => { return; })
                    .catch(() => { return; });
        })()
            .catch(() => { return; });
    });

};

export const sendToSecretarium = async ({
    deployment,
    wasmB64,
    target,
    targetCluster,
    previousDeployment
}: {
    deployment: Deployment & { deploymentAddress?: DeploymentAddress | null };
    wasmB64?: string;
    target: string;
    targetCluster?: string;
    previousDeployment?: Deployment & { deploymentAddress: DeploymentAddress | null } | null;
}) => {

    const targetRef = previousDeployment?.deploymentAddress ? await prisma.deploymentAddress.findFirst({
        where: {
            id: previousDeployment.deploymentAddress.id
        }
    }) : null;

    let currentSCP = scp;
    if (targetCluster) {
        logger.debug(`Using out-of-band deployment cluster ${targetCluster} for ${target}`);

        const runningKey = scpOps.getRunningKey();
        const contextOrganisation = (await prisma.application.findFirst({
            where: {
                id: deployment.applicationId
            },
            include: {
                organisation: true
            }
        }))?.organisation;
        const clusterAllocation = await prisma.clusterAllocation.findFirst({
            where: {
                cluster: {
                    id: targetCluster,
                    deletedAt: {
                        isSet: false
                    }
                },
                organisationId: contextOrganisation?.id ?? ''
            },
            include: {
                cluster: true
            }
        });
        if (runningKey && clusterAllocation?.cluster) {
            const sideSCP = new SCP();
            await sideSCP.connect(`wss://${clusterAllocation.cluster.fqdn}`, runningKey);
            // Need to extract connection information for this parallel track
            currentSCP = sideSCP;
        }
    }

    const handleSuccess = async () => {
        logger.debug(`Successfully ${targetRef ? 'updated' : 'registered'} smart contract: ${target}`);
        await prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: 'deployed'
            }
        });

        logger.debug(`Setting default kredit limits for application ${deployment.applicationId}`);
        await Sentry.startSpan({
            name: 'SCP Subtask',
            op: 'scp.task.kredit.transaction.allow',
            description: 'Secretarium Task Transaction Kredit Allocation'
        }, async () => {
            return await new Promise((resolve, reject) => {

                currentSCP.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'set_allowed_kredit_per_transaction', `klave-app-set-transaction-limit-${deployment.applicationId}`, {
                    app_id: deployment.applicationId,
                    kredit: 100_000_000
                }).onExecuted(result => {
                    resolve(result);
                }).onError(error => {
                    reject(error);
                }).send()
                    .catch(reject);
            });
        });

        await Sentry.startSpan({
            name: 'SCP Subtask',
            op: 'scp.task.kredit.query.allow',
            description: 'Secretarium Task Query Kredit Allocation'
        }, async () => {
            return await new Promise((resolve, reject) => {

                currentSCP.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'set_allowed_kredit_per_query', `klave-app-set-query-limit-${deployment.applicationId}`, {
                    app_id: deployment.applicationId,
                    kredit: 1_000_000_000
                }).onExecuted(result => {
                    resolve(result);
                }).onError(error => {
                    reject(error);
                }).send()
                    .catch(reject);
            });
        });

        if (previousDeployment) {
            logger.debug(`Deleting previous deployment ${previousDeployment.id} for ${target}`);
            const createCaller = createCallerFactory(router);
            const caller = createCaller({
                prisma,
                session: {},
                override: '__system_post_deploy'
            } as unknown as Context);
            caller.v0.deployments.delete({
                deploymentId: previousDeployment.id
            }).catch((error) => {
                logger.debug(`Failure while deleting previous deployment ${previousDeployment.id} for ${target}:, ${error}`);
            });
        }
    };

    const rollback = async () => {
        if (previousDeployment) {
            logger.debug(`Rolling back deployment ${previousDeployment.id}`);
            await prisma.deployment.update({
                where: {
                    id: previousDeployment.id
                },
                data: {
                    status: previousDeployment.status
                }
            });
        }
    };

    await Sentry.startSpan({
        name: 'SCP Subtask',
        op: 'scp.task',
        description: 'Secretarium Task'
    }, async () => {
        if (wasmB64) {
            logger.debug(`${targetRef ? 'Updating' : 'Registering'} smart contract: ${target}`);
            await currentSCP.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'deploy_instance', `klave-${targetRef ? 'update' : 'register'}-${deployment.id}`, {
                app_id: deployment.applicationId,
                fqdn: target,
                wasm_bytes_b64: wasmB64
                // own_enclave: true,
            })
                .onResult((result) => {
                    const errorString = JSON.stringify(result);
                    if (errorString.includes('deployed'))
                        return;
                    logger.debug(`Received unexpected message during ${!targetRef ? 'update' : 'registration'} of smart contract ${target}: ${errorString}`);
                })
                .onExecuted(() => {
                    (async () => {
                        await handleSuccess();
                    })().catch((error) => {
                        logger.debug(`Error while processing success callback ${!targetRef ? 'updating' : 'registering'} ${target}: ${JSON.stringify(error)}`);
                    });
                })
                .onError((error) => {
                    (async () => {
                        await rollback();
                        await prisma.deployment.update({
                            where: {
                                id: deployment.id
                            },
                            data: {
                                status: 'errored',
                                buildOutputStdErr: error?.toString()
                            }
                        });
                        logger.debug(`Error while ${!targetRef ? 'updating' : 'registering'} smart contract ${target}: ${error}`);
                    })().catch(() => {
                        logger.debug(`Error while processing error callback ${!targetRef ? 'updating' : 'registering'} ${target}: ${JSON.stringify(error)}`);
                    });
                }).send().catch((error) => {
                    logger.debug(`Error while performing ${!targetRef ? 'update' : 'registration'} for ${target}: ${JSON.stringify(error)}`);
                });
            // } else if (previousDeployment?.deploymentAddress?.fqdn && deployment?.deploymentAddress?.fqdn) {
            //     logger.debug(`Releasing smart contract: ${deployment.deploymentAddress.fqdn} as ${target}`);
            //     await currentSCP.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'clone_instance', `klave-release-${deployment.id}`, {
            //         app_id: deployment.applicationId,
            //         fqdn: target,
            //         source_fqdn: previousDeployment.deploymentAddress.fqdn
            //     })
            //         .onResult((result) => {
            //             console.log('OOPSSSS', result);
            //         })
            //         .onExecuted(() => {
            //             (async () => {
            //                 await handleSuccess();
            //             })().catch(() => { return; });
            //         })
            //         .onError((error) => {
            //             (async () => {
            //                 await rollback();
            //                 await prisma.deployment.update({
            //                     where: {
            //                         id: deployment.id
            //                     },
            //                     data: {
            //                         status: 'errored',
            //                         buildOutputStdErr: error?.toString()
            //                     }
            //                 });
            //                 logger.debug(`Error while releasing smart contract ${target}: ${error}`);
            //             })().catch(() => { return; });

            //         }).send().catch(() => {
            //             // Swallow this error
            //         });
        } else {
            logger.debug(`No wasm to deploy for ${target}`);
            await rollback();
        }
    });

    if (targetCluster)
        currentSCP.close();
};