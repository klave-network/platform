import { exec, ExecException } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import TOML from 'toml';
import { getFinalParseConfig } from '@klave/constants';
import { BuildDependenciesManifest, BuildMiniVMOptions } from './buildMiniVm';

export type ParentMessage = {
    type: 'read';
    id: number;
    filename?: string;
    contents: string | null;
} | {
    type: 'write';
    id: number;
    filename: string;
    contents: string | null;
} | {
    type: 'compile';
}

type BuildHostMessage = {
    type: 'read';
    id: number;
    filename: string;
} | {
    type: 'write';
    filename: string;
    contents: string | Uint8Array | null;
} | {
    type: 'diagnostic';
    diagnostics: string;
} | {
    type: 'progress';
    stage: 'clone' | 'fetch' | 'install' | 'build';
    output: {
        type: 'stdout' | 'stderr';
        full: boolean;
        time: string;
        data: string;
    };
} | {
    type: 'errored';
    error: Error;
    stdout?: string;
    stderr?: string;
} | {
    type: 'done';
    stats: unknown;
    dependencies?: BuildDependenciesManifest
    stdout?: string;
    stderr?: string;
} | {
    type: 'start';
    version: string;
} | {
    type: 'compile';
}

export type BuildHostCreatorOptions = BuildMiniVMOptions & {
    token: string;
}

export type BuildHostOptions = BuildHostCreatorOptions & {
    workingDirectory: string;
}

export class BuildHost {

    id = uuid();
    ascVersion = 'unknown';
    entryFile = -1;
    listeners: Record<string, Array<(value: BuildHostMessage) => void>> = {};
    usedDependencies: BuildDependenciesManifest = {};

    constructor(private options: BuildHostOptions) { }

    on(event: 'message', listener: (value: BuildHostMessage) => void): this {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event]?.push(listener);
        return this;
    }

    postMessage(message: ParentMessage) {
        if (message.type === 'compile') {
            try {

                const { token, workingDirectory, repo, context: { commit: { after } } } = this.options;
                type PackageManager = 'yarn' | 'npm' | 'cargo';
                const packageManagerCommands: Record<PackageManager, [string, string]> = {
                    yarn: ['yarn install', 'yarn build'],
                    npm: ['npm install', 'npm run build'],
                    cargo: ['cargo check', 'cargo build --target wasm32-unknown-unknown --release']
                };
                let packageManager: keyof typeof packageManagerCommands = 'yarn';

                new Promise<void>((resolve, reject) => {
                    const hook = exec(`git clone --depth=1 https://git:${token}@github.com/${repo.owner}/${repo.name} .`, {
                        cwd: workingDirectory
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.listeners['message']?.forEach(listener => {
                            listener({ type: 'progress', stage: 'clone', output: { type: 'stdout', full: true, time: new Date().toISOString(), data: stdout } });
                            listener({ type: 'progress', stage: 'clone', output: { type: 'stderr', full: true, time: new Date().toISOString(), data: stderr } });
                        });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.listeners['message']?.forEach(listener => listener({ type: 'progress', stage: 'clone', output: { type: 'stdout', full: false, time: new Date().toISOString(), data } }));
                    });
                }).then(async () => new Promise<void>((resolve, reject) => {
                    const hook = exec(`git reset --hard ${after}`, {
                        cwd: workingDirectory
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.listeners['message']?.forEach(listener => {
                            listener({ type: 'progress', stage: 'fetch', output: { type: 'stdout', full: true, time: new Date().toISOString(), data: stdout } });
                            listener({ type: 'progress', stage: 'fetch', output: { type: 'stderr', full: true, time: new Date().toISOString(), data: stderr } });
                        });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.listeners['message']?.forEach(listener => listener({ type: 'progress', stage: 'fetch', output: { type: 'stdout', full: false, time: new Date().toISOString(), data } }));
                    });
                })).then(async () => {

                    if (fs.existsSync(path.join(workingDirectory, 'yarn.lock')))
                        packageManager = 'yarn';
                    else if (fs.existsSync(path.join(workingDirectory, 'package-lock.json')))
                        packageManager = 'npm';
                    else if (fs.existsSync(path.join(workingDirectory, 'Cargo.lock')) || fs.existsSync(path.join(workingDirectory, 'Cargo.toml')))
                        packageManager = 'cargo';

                    return new Promise<void>((resolve, reject) => {
                        const hook = exec(packageManagerCommands[packageManager][0], {
                            cwd: workingDirectory
                        }, (error, stdout, stderr) => {
                            if (error) return reject(error);
                            this.listeners['message']?.forEach(listener => {
                                listener({ type: 'progress', stage: 'install', output: { type: 'stdout', full: true, time: new Date().toISOString(), data: stdout } });
                                listener({ type: 'progress', stage: 'install', output: { type: 'stderr', full: true, time: new Date().toISOString(), data: stderr } });
                            });
                            resolve();
                        });
                        hook.stdout?.on('data', (data) => {
                            this.listeners['message']?.forEach(listener => listener({ type: 'progress', stage: 'install', output: { type: 'stdout', full: false, time: new Date().toISOString(), data } }));
                        });
                    });
                }).then(async () => new Promise<void>((resolve, reject) => {
                    const hook = exec(packageManagerCommands[packageManager][1], {
                        cwd: workingDirectory,
                        env: {
                            ...process.env,
                            INIT_CWD: workingDirectory
                        }
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.listeners['message']?.forEach(listener => {
                            listener({ type: 'progress', stage: 'build', output: { type: 'stdout', full: true, time: new Date().toISOString(), data: stdout } });
                            listener({ type: 'progress', stage: 'build', output: { type: 'stderr', full: true, time: new Date().toISOString(), data: stderr } });
                        });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.listeners['message']?.forEach(listener => listener({ type: 'progress', stage: 'build', output: { type: 'stdout', full: false, time: new Date().toISOString(), data } }));
                    });
                })).then(async () => new Promise<void>((resolve, reject) => {

                    const klaveConfig = getFinalParseConfig(fs.readFileSync(path.join(workingDirectory, 'klave.json'), 'utf-8'));
                    if (klaveConfig.error)
                        return reject(klaveConfig.error);

                    const appIndex = klaveConfig.data.applications?.findIndex(app => app.slug === this.options.application?.slug);
                    if (appIndex === undefined || appIndex === -1)
                        return reject(new Error('Application not found'));

                    if (packageManager === 'yarn' || packageManager === 'npm') {
                        const appCompiledPath = path.join(workingDirectory, '.klave');
                        fs.readdirSync(appCompiledPath).forEach(file => {
                            if (file.split('-').shift() === `${appIndex}`)
                                this.listeners['message']?.forEach(listener => listener({
                                    type: 'write',
                                    contents: fs.readFileSync(path.join(appCompiledPath, file), null),
                                    filename: path.basename(file)
                                }));
                        });
                    } else if (packageManager === 'cargo') {

                        const appPath = klaveConfig.data.applications?.[appIndex]?.rootDir ?? '.';
                        const tomlConf = TOML.parse(fs.readFileSync(path.join(workingDirectory, appPath, 'Cargo.toml'), 'utf-8'));

                        Object.entries(tomlConf.dependencies ?? {})?.forEach(([name, version]) => {
                            this.usedDependencies[name] = {
                                version: (typeof version === 'string' ? version : (version as { version: string }).version) ?? 'unknown',
                                digests: {}
                            };
                        });

                        const appCompiledPath = path.join(workingDirectory, 'target', 'wasm32-unknown-unknown', 'release');
                        fs.readdirSync(appCompiledPath).forEach(file => {
                            const filename = file.split('.').shift();
                            if (filename === tomlConf.package?.name || filename === tomlConf.package?.name?.replaceAll('-', '_'))
                                this.listeners['message']?.forEach(listener => listener({
                                    type: 'write',
                                    contents: fs.readFileSync(path.join(appCompiledPath, file), null),
                                    filename: file
                                }));
                        });
                    }

                    resolve();

                })).then(async () => {
                    this.listeners['message']?.forEach(listener => listener({ type: 'done', stats: {}, dependencies: this.usedDependencies }));
                }).catch(async (error) => {
                    this.listeners['message']?.forEach(listener => listener({ type: 'errored', error }));
                });
            }

            catch (e: unknown) {
                if (typeof e === 'string')
                    console.error(e);
                else if (e instanceof Error)
                    console.error(e.message);
                else
                    console.error((e as ExecException));
            }
        }
    }

    async terminate(): Promise<number> {
        return 0;
    }
}

export const createBuildHost = async (options: BuildHostCreatorOptions) => {

    const compilationId = uuid();
    const workingDirectory = path.join(process.env['NODE_ENV'] === 'development' ? process.cwd() : '/', 'tmp', '.klave', 'buildHost', compilationId);

    if (!fs.existsSync(workingDirectory))
        fs.mkdirSync(workingDirectory, { recursive: true });

    const buildHost = new BuildHost({
        ...options,
        workingDirectory
    });

    buildHost.on('message', message => {
        if (message.type === 'done') {
            fs.rmSync(workingDirectory, { recursive: true });
        }
    });

    buildHost.postMessage({ type: 'compile' });

    return buildHost;
};
