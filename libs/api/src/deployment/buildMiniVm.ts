import nodePath from 'node:path';
import fs from 'fs-extra';
import sigstore from 'sigstore';
import fetch from 'node-fetch';
import { webcrypto } from 'node:crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ErrorObject, serializeError } from 'serialize-error';
import type { Stats } from 'assemblyscript/dist/asc';
import { Utils } from '@secretarium/connector';
import { createCompiler } from '@klave/compiler';
import type { Context } from 'probot';
// import { KlaveRcConfiguration } from '@klave/sdk';
import { DeploymentPushPayload } from '../types';
import { Repo } from '@prisma/client';
import { dummyMap } from './dummyVmFs';
import { logger } from '@klave/providers';

type BuildDependenciesManifest = Record<string, {
    version: string;
    digests: Record<string, string>
}>;

type BuildOutput = {
    stdout: string;
    stderr: string;
    dependenciesManifest: BuildDependenciesManifest;
} & ({
    success: true;
    result: {
        stats: Stats;
        wasm: Uint8Array;
        wat?: string;
        dts?: string;
        signature?: sigstore.Bundle;
    };
} | {
    success: false;
    error?: Error | ErrorObject;
})

type BuildMiniVMEvent = 'start' | 'emit' | 'diagnostic' | 'error' | 'done'
type BuildMiniVMEventHandler = (result?: BuildOutput) => void;

export type DeploymentContext<Type> = {
    octokit: Context['octokit']
} & Type;

export class BuildMiniVM {

    private eventHanlders: Partial<Record<BuildMiniVMEvent, BuildMiniVMEventHandler[]>> = {};
    private proxyAgent: HttpsProxyAgent<string> | undefined;
    private usedDependencies: BuildDependenciesManifest = {};

    constructor(private options: {
        type: 'github';
        context: DeploymentContext<DeploymentPushPayload>;
        repo: Repo;
        // TODO Reenable the KlaveRcConfiguration[...] type
        application: any;
        dependencies: Record<string, string>;
    }) {
        if (process.env['KLAVE_SQUID_URL'])
            this.proxyAgent = new HttpsProxyAgent(process.env['KLAVE_SQUID_URL']);
    }

    getContentSync(path: string): string | null {
        const normalisedPath = path.split(nodePath.sep).join(nodePath.posix.sep);
        return dummyMap[normalisedPath] ?? null;
    }

    async getContent(path?: string): Promise<Awaited<ReturnType<Context['octokit']['repos']['getContent']>> | { data: string | null }> {

        const { context: { octokit, ...context }, repo } = this.options;
        const normalisedPath = path?.split(/[\\/]/).filter((s, i) => !(i === 0 && s === '.')).join(nodePath.posix.sep);

        if (!normalisedPath)
            return { data: null };

        try {
            if (!normalisedPath.includes('node_modules')) {
                logger.debug(`Getting GitHub content for '${normalisedPath}'`, {
                    parent: 'bmv'
                });
                return await octokit.repos.getContent({
                    owner: repo.owner,
                    repo: repo.name,
                    ref: context.commit.ref,
                    path: `${this.options.application.rootDir}${normalisedPath ? `/${normalisedPath}` : ''}`,
                    mediaType: {
                        format: 'raw+json'
                    }
                });
            }
        } catch {
            //
        }

        try {
            const components = normalisedPath?.split('node_modules') ?? [];
            const lastComponent = components.pop();
            if (lastComponent?.startsWith('/')) {
                const comps = lastComponent.substring(1).split('/');
                const packageName = comps[0]?.startsWith('@') ? `${comps.shift()}/${comps.shift()}` : comps.shift() ?? '';
                const packageVersion = packageName ? this.options.dependencies?.[packageName] : undefined;
                const filePath = comps.join('/');
                let version = packageVersion ?? '';
                let data = '';

                const unpkgDomain = 'https://www.unpkg.com/';
                const url = `${unpkgDomain}${packageName}${packageVersion ? `@${packageVersion}` : ''}/${filePath}`;
                const urlHash = Utils.toHex(new Uint8Array(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(url))));
                const assetLocation = nodePath.resolve(`./.cache/klave/compiler/assets/${urlHash}`);

                if (fs.existsSync(assetLocation)) {

                    logger.debug(`Getting disk cache content for '${lastComponent}'`, {
                        parent: 'bmv'
                    });

                    if (fs.existsSync(`${assetLocation}/version`) && fs.existsSync(`${assetLocation}/data`)) {
                        version = fs.readFileSync(`${assetLocation}/version`, 'utf-8');
                        data = fs.readFileSync(`${assetLocation}/data`, 'utf-8');
                    }

                } else {
                    logger.debug(`Getting unpkg content for '${lastComponent}'`, {
                        parent: 'bmv'
                    });
                    const response = await fetch(url, {
                        agent: this.proxyAgent
                    });

                    const effectiveComps = response.url.replace(unpkgDomain, '').split('/');
                    const effectiveName = effectiveComps[0]?.startsWith('@') ? `${effectiveComps.shift()}/${effectiveComps.shift()}` : effectiveComps.shift() ?? '';
                    const effectiveVersion = effectiveName ? effectiveName.split('@')[2] ?? effectiveName.split('@')[1] ?? '*' : '*';

                    fs.mkdirpSync(assetLocation);
                    if (response.ok) {
                        version = effectiveVersion;
                        data = await response.text();
                        fs.writeFileSync(`${assetLocation}/version`, version);
                        fs.writeFileSync(`${assetLocation}/data`, data);
                    }
                }

                if (data !== '') {
                    if (!this.usedDependencies[packageName])
                        this.usedDependencies[packageName] = {
                            version,
                            digests: {}
                        };
                    this.usedDependencies[packageName]!.digests[filePath] = Utils.toHex(await Utils.hash(new TextEncoder().encode(data)));

                    // TODO - Store the response in a cahing layer
                    // response.getHeader('location');
                    return { data };
                }
            }
        } catch {
            //
        }

        if (normalisedPath)
            return { data: this.getContentSync(normalisedPath) };

        logger.debug(`Couldn't resolve content for '${normalisedPath}'`, {
            parent: 'bmv'
        });
        return { data: null };
    }

    async getRootContent() {
        try {
            const content = await this.getContent();
            if (typeof content.data === 'object' && Array.isArray(content.data)) {
                const compilableFiles = content.data.find(file => ['index.ts'].includes(file.name));
                return await this.getContent(`${compilableFiles?.name}`);
            } else
                return content;
        } catch (e) {
            logger.debug(`Error getting root content: ${e}`, {
                parent: 'bmv'
            });
            return { data: null };
        }
    }

    on(event: BuildMiniVMEvent, callback: BuildMiniVMEventHandler) {
        this.eventHanlders[event] = [
            ...(this.eventHanlders[event] ?? []),
            callback
        ];
    }

    async build(): Promise<BuildOutput> {

        const rootContent = await this.getRootContent();
        dummyMap['..ts'] = rootContent?.data?.toString() ?? null;

        let compiledBinary = new Uint8Array(0);
        let compiledWAT: string | undefined;
        let compiledDTS: string | undefined;
        try {
            const compiler = await createCompiler();
            return new Promise<BuildOutput>((resolve) => {
                compiler.on('message', (message) => {
                    if (message.type === 'start') {
                        this.eventHanlders['start']?.forEach(handler => handler());
                    } else if (message.type === 'read') {
                        this.getContent(message.filename).then(contents => {
                            compiler.postMessage({
                                type: 'read',
                                id: message.id,
                                contents: contents.data
                            });
                        });
                    } else if (message.type === 'write') {
                        this.eventHanlders['emit']?.forEach(handler => handler(message));
                        if ((message.filename as string).endsWith('.wasm'))
                            compiledBinary = message.contents;
                        if ((message.filename as string).endsWith('.wat'))
                            compiledWAT = message.contents;
                        if ((message.filename as string).endsWith('.d.ts'))
                            compiledDTS = message.contents;
                    } else if (message.type === 'diagnostic') {
                        this.eventHanlders['diagnostic']?.forEach(handler => handler(message));
                    } else if (message.type === 'errored') {
                        logger.debug('Compiler Errored: ' + message.error?.message ?? message.error, {
                            parent: 'bmv'
                        });
                        this.eventHanlders['error']?.forEach(handler => handler(message));
                        compiler.terminate().finally(() => {
                            resolve({
                                success: false,
                                error: message.error,
                                dependenciesManifest: this.usedDependencies,
                                stdout: message.stdout ?? '',
                                stderr: message.stderr ?? ''
                            });
                        });
                    } else if (message.type === 'done') {
                        let signature: sigstore.Bundle;
                        // TODO Add OIDC token
                        sigstore.sign(Buffer.from(compiledBinary), { identityToken: '' })
                            .then(bundle => {
                                signature = bundle;
                            })
                            .catch(() => { return; })
                            .finally(() => {
                                const output = {
                                    success: true,
                                    result: {
                                        stats: message.stats,
                                        wasm: compiledBinary,
                                        wat: compiledWAT,
                                        dts: compiledDTS,
                                        signature
                                    },
                                    dependenciesManifest: this.usedDependencies,
                                    stdout: message.stdout ?? '',
                                    stderr: message.stderr ?? ''
                                };
                                this.eventHanlders['done']?.forEach(handler => handler(output));
                                compiler.terminate().finally(() => {
                                    resolve(output);
                                });
                            });
                    }
                });
            });
        } catch (error) {
            logger.debug('General failure: ' + error, {
                parent: 'bmv'
            });
            return {
                success: false,
                error: serializeError(error),
                dependenciesManifest: this.usedDependencies,
                stdout: '',
                stderr: ''
            };
        }
    }
}

export default BuildMiniVM;