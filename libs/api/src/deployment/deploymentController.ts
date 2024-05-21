import { DeploymentPushPayload } from '../types';
import { v4 as uuid } from 'uuid';
import * as Sentry from '@sentry/node';
import { scp, logger } from '@klave/providers';
import { Deployment, prisma, DeploymentAddress, Commit, CommitVerificationReason } from '@klave/db';
import { Utils } from '@secretarium/connector';
import * as path from 'node:path';
import prettyBytes from 'pretty-bytes';
import BuildMiniVM, { DeploymentContext } from './buildMiniVm';
import { router } from '../router';
import { Context } from '../context';
import { getFinalParseConfig } from '@klave/constants';
import { createCallerFactory } from '../trpc';

export const deployToSubstrate = async (deploymentContext: DeploymentContext<DeploymentPushPayload>, options?: { onlyApp?: string }) => {

    const { octokit, ...context } = deploymentContext;
    let files: NonNullable<Awaited<ReturnType<typeof octokit.repos.compareCommits>>['data']['files']> = [];
    let commit: Commit | null = null;

    if (context.commit.before) {
        try {
            const { data } = await octokit.repos.compareCommits({
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
            const { data } = await octokit.repos.getCommit({
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

    const klaveConfigurationResponse = await octokit.repos.getContent({
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

                const branchName = context.commit.ref?.includes('/') ? context.commit.ref.split('/').pop() : repo.defaultBranch ?? 'master';
                const buildId = context.commit.after.substring(0, 8);
                const domains = await prisma.domain.findMany({
                    where: {
                        applicationId: application.id,
                        verified: true
                    }
                });

                const deploymentSet = uuid();
                const targets = domains
                    .map(domain => `${branchName}.${application.id.split('-')[0]}.${application.slug}.${domain.fqdn}`)
                    .concat(...[
                        `${branchName}.${application.id.split('-')[0]}.${application.slug}.${application.organisation.slug.replace('~$~', '')}.klave.network`,
                        application.deployCommitLedgers ? `${buildId}.${application.id.split('-')[0]}.${application.slug}.${application.organisation.slug.replace('~$~', '')}.klave.network` : undefined
                    ].filter(Boolean));

                targets.forEach(target => {

                    (async () => {

                        let contextualDeploymentId: string | undefined;

                        try {
                            const previousDeployment = await prisma.deployment.findFirst({
                                where: {
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
                                    }
                                    // TODO: Make sure we get the push event
                                    // pushEvent
                                }
                            });

                            contextualDeploymentId = deployment.id;

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

                            (new Promise((__unusedResolve, reject) => {
                                setTimeout(reject, 60000);
                                prisma.deployment.update({
                                    where: {
                                        id: deployment.id
                                    },
                                    data: {
                                        status: 'deploying'
                                    }
                                }).catch(reject);
                            })).catch(async () => {
                                const currentState = await prisma.deployment.findUnique({
                                    where: {
                                        id: deployment.id
                                    }
                                });
                                if (currentState?.status !== 'deployed' && currentState?.status !== 'errored') {
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
                            });

                            logger.debug(`Starting compilation ${deployment.id} ...`, {
                                parent: 'dpl'
                            });

                            const applicationObject = availableApplicationsConfig[application.slug];

                            const buildVm = new BuildMiniVM({
                                type: 'github',
                                context: deploymentContext,
                                repo,
                                application: applicationObject,
                                deployment
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

                            const { result: { wasm, wat, dts, routes } } = buildResult;
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
                                    buildOutputRoutes: routes
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

                            await sendToSecretarium({
                                deployment,
                                wasmB64,
                                target,
                                previousDeployment
                            });

                        } catch (errorIn) {
                            let error = errorIn;
                            logger.debug(`Deployment failure for ${target}: ${errorIn}`);
                            if (error instanceof Error) {
                                error = {
                                    message: error.message,
                                    stack: process.env['NODE_ENV'] === 'development' ? error.stack : undefined
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
    previousDeployment
}: {
    deployment: Deployment & { deploymentAddress?: DeploymentAddress | null };
    wasmB64?: string;
    target: string;
    previousDeployment?: Deployment & { deploymentAddress: DeploymentAddress | null } | null;
}) => {

    const targetRef = previousDeployment?.deploymentAddress ? await prisma.deploymentAddress.findFirst({
        where: {
            id: previousDeployment.deploymentAddress.id
        }
    }) : null;

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
            await scp.newTx('wasm-manager', 'deploy_instance', `klave-${targetRef ? 'update' : 'register'}-${deployment.id}`, {
                app_id: deployment.applicationId,
                fqdn: target,
                wasm_bytes_b64: wasmB64
                // own_enclave: true,
            })
                .onExecuted(() => {
                    (async () => {
                        await handleSuccess();
                    })().catch(() => { return; });
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
                    })().catch(() => { return; });
                }).send().catch(() => {
                    // Swallow this error
                });
            // } else if (previousDeployment?.deploymentAddress?.fqdn && deployment?.deploymentAddress?.fqdn) {
            //     logger.debug(`Releasing smart contract: ${deployment.deploymentAddress.fqdn} as ${target}`);
            //     await scp.newTx('wasm-manager', 'clone_instance', `klave-release-${deployment.id}`, {
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
        }
    });
};