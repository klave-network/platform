import { DeploymentPushPayload } from '../types';
import { v4 as uuid } from 'uuid';
import { scp, logger } from '@klave/providers';
import { Deployment, prisma, DeploymentAddress } from '@klave/db';
// import type { KlaveRcConfiguration } from '@klave/sdk';
import { Utils } from '@secretarium/connector';
import * as path from 'node:path';
import prettyBytes from 'pretty-bytes';
import BuildMiniVM, { DeploymentContext } from './buildMiniVm';
import { router } from '../router';

export const deployToSubstrate = async (deploymentContext: DeploymentContext<DeploymentPushPayload>) => {

    const { octokit, ...context } = deploymentContext;
    let files: NonNullable<Awaited<ReturnType<typeof octokit.repos.compareCommits>>['data']['files']> = [];

    if (context.commit.before) {
        try {
            const { data: { files: filesManifest } } = await octokit.repos.compareCommits({
                owner: context.repo.owner,
                repo: context.repo.name,
                base: context.commit.before,
                head: context.commit.after
            });

            if (filesManifest)
                files = filesManifest;
        } catch (e) {
            logger.debug('Error while comparing files from github', e);
        }
    }

    if (!files?.length) {
        try {
            const { data: { files: filesManifest } } = await octokit.repos.getCommit({
                owner: context.repo.owner,
                repo: context.repo.name,
                ref: context.commit.after
            });

            if (filesManifest)
                files = filesManifest;
        } catch (e) {
            logger.error('Error while fetching files from github', e);
        }
    }

    if (!files.length && !context.forceDeploy)
        return;

    const repo = await prisma.repo.findUnique({
        include: {
            applications: true
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

    const packageJsonResponse = await octokit.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        ref: context.commit.ref,
        path: 'package.json',
        mediaType: {
            format: 'raw+json'
        }
    });

    const packageJsonData = Array.isArray(packageJsonResponse.data) ? packageJsonResponse.data[0] : packageJsonResponse.data;

    if (!packageJsonData)
        return;

    let packageJson: any;
    try {
        packageJson = JSON.parse(packageJsonData.toString()) as any;
    } catch (e) {
        logger.error('Error while parsing package.json', e);
        return;
    }

    if (!packageJson)
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

    let klaveConfiguration: any;
    try {
        klaveConfiguration = JSON.parse(klaveConfigurationData.toString());
    } catch (e) {
        logger.error('Error while parsing klave.json', e);
        return;
    }

    if (!klaveConfiguration)
        return;

    const availableApplicationsConfig = klaveConfiguration.applications.reduce((prev: any, current: any) => {
        prev[current.name] = current;
        return prev;
    }, {} as Record<string, any['applications'][number]>);

    // TODO Reenable the KlaveRcConfiguration type
    // const config = repo.config as any;
    // const availableApplicationsConfig = config.applications.reduce((prev: any, current: any) => {
    //     prev[current.name] = current;
    //     return prev;
    // }, {} as Record<string, any['applications'][number]>);

    repo.applications.forEach(application => {

        (async () => {

            // Bail out if the application is not in the running configuration
            if (!availableApplicationsConfig[application.name])
                return;

            // TODO There is typing error in this location
            const fileChanged = files.filter(({ filename }) => {
                const commitFileDir = path.normalize(path.join('/', filename));
                const appPath = path.normalize(path.join('/', availableApplicationsConfig[application.name]?.rootDir ?? ''));
                return commitFileDir.startsWith(appPath) || filename === 'klave.json';
            });

            if (fileChanged.length === 0 && !context.forceDeploy)
                return;

            logger.info(`Deploying ${application.name} from ${context.commit.after}`);

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
                        payload: context
                    }
                }
            });

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
                const applicationId = application.id.split('-').shift();
                const targets = domains
                    .map(domain => `${branchName}.${domain.fqdn}`)
                    .concat(`${branchName}.${applicationId}.sta.klave.network`, `${buildId}.${applicationId}.sta.klave.network`);

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
                                    expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                                    version: availableApplicationsConfig[application.name]?.version,
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

                            const buildVm = new BuildMiniVM({
                                type: 'github',
                                context: deploymentContext,
                                repo,
                                application: availableApplicationsConfig[application.name],
                                dependencies: {
                                    ...(packageJson.optionalDependencies ?? {}),
                                    ...(packageJson.peerDependencies ?? {}),
                                    ...(packageJson.dependencies ?? {}),
                                    ...(packageJson.devDependencies ?? {})
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
                                        buildOutputErrorObj: buildResult.error as any
                                    }
                                });
                                return;
                            }

                            const { result: { wasm, wat, dts } } = buildResult;
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
                                        buildOutputErrorObj: { error: 'Empty wasm' } as any
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
                                    buildOutputWASM: wasmB64,
                                    buildOutputWAT: wat,
                                    buildOutputDTS: dts
                                }
                            });

                            if (dts) {
                                const matches = Array.from(dts.matchAll(/^export declare function (.*)\(/gm));
                                const validMatches = matches
                                    .map(match => match[1])
                                    .filter(Boolean)
                                    .filter(match => !['__new', '__pin', '__unpin', '__collect', 'register_routes'].includes(match));
                                await prisma.deployment.update({
                                    where: {
                                        id: deployment.id
                                    },
                                    data: {
                                        contractFunctions: validMatches
                                    }
                                });
                            }

                            await sendToSecretarium({
                                deployment,
                                wasmB64,
                                target,
                                previousDeployment
                            });

                        } catch (error: any) {
                            logger.debug(`Deployment failure for ${target}: ${error}`);
                            try {
                                if (contextualDeploymentId)
                                    await prisma.deployment.update({
                                        where: {
                                            id: contextualDeploymentId
                                        },
                                        data: {
                                            status: 'errored',
                                            buildOutputErrorObj: {
                                                message: error.message,
                                                stack: error.stack
                                            }
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
            const caller = router.v0.deployments.createCaller({
                prisma,
                session: {},
                override: '__system_post_deploy'
            } as any);
            caller.delete({
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

    if (wasmB64) {
        logger.debug(`${targetRef ? 'Updating' : 'Registering'} smart contract: ${target}`);
        await scp.newTx('wasm-manager', 'deploy_instance', `klave-deployment-${deployment.id}`, {
            app_id: deployment.applicationId,
            fqdn: target,
            wasm_bytes_b64: wasmB64
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
    } else if (deployment.deploymentAddress?.fqdn) {
        logger.debug(`Releasing smart contract: ${deployment.deploymentAddress.fqdn} as ${target}`);
        await scp.newTx('wasm-manager', 'clone_instance', `klave-deployment-${deployment.id}`, {
            app_id: deployment.applicationId,
            fqdn: target,
            source_fqdn: deployment.deploymentAddress.fqdn
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
                    logger.debug(`Error while releasing smart contract ${target}: ${error}`);
                })().catch(() => { return; });

            }).send().catch(() => {
                // Swallow this error
            });
    } else {
        logger.debug(`No wasm to deploy for ${target}`);
    }
};