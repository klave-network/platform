import { exec, ExecException } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import TOML from 'toml';
import { getFinalParseConfig, StagedOutputGroups } from '@klave/constants';
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
};

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
    stage: keyof StagedOutputGroups;
    output: StagedOutputGroups[keyof StagedOutputGroups][number];
    sourceType?: string;
} | {
    type: 'errored';
    error: Error;
    sourceType: string;
    dependencies?: BuildDependenciesManifest
    output?: StagedOutputGroups;
    stdout?: string;
    stderr?: string;
} | {
    type: 'done';
    stats: unknown;
    sourceType: string;
    dependencies?: BuildDependenciesManifest
    output: StagedOutputGroups;
    stdout?: string;
    stderr?: string;
} | {
    type: 'start';
    version: string;
} | {
    type: 'compile';
};

export type BuildHostCreatorOptions = BuildMiniVMOptions & {
    token: string;
};

export type BuildHostOptions = BuildHostCreatorOptions & {
    workingDirectory: string;
};

export class BuildHost {

    id = uuid();
    ascVersion = 'unknown';
    entryFile = -1;
    listeners: Record<string, Array<(value: BuildHostMessage) => void>> = {};
    usedDependencies: BuildDependenciesManifest = {};
    outputProgress: StagedOutputGroups = {
        clone: [],
        fetch: [],
        install: [],
        build: []
    };

    constructor(private options: BuildHostOptions) { }

    on(event: 'message', listener: (value: BuildHostMessage) => void): this {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event]?.push(listener);
        return this;
    }

    consolePrint(stage: keyof StagedOutputGroups, output: Partial<StagedOutputGroups[keyof StagedOutputGroups][number]>) {
        const timedOutput = { ...output, time: new Date().toISOString() } as StagedOutputGroups[keyof StagedOutputGroups][number];
        this.outputProgress[stage].push(timedOutput);
        this.listeners['message']?.forEach(listener => listener({
            type: 'progress',
            stage,
            output: timedOutput
        }));
    }

    postMessage(message: ParentMessage) {
        if (message.type === 'compile') {
            try {

                const { token, workingDirectory, repo, context: { commit: { after } } } = this.options;
                type PackageManager = 'yarn' | 'npm' | 'cargo';
                const packageManagerCommands: Record<PackageManager, [string, string]> = {
                    yarn: ['yarn install', 'yarn build'],
                    npm: ['npm install', 'npm run build'],
                    cargo: ['cargo check', 'cargo component build --target wasm32-unknown-unknown --release']
                };
                let packageManager: keyof typeof packageManagerCommands = 'yarn';

                new Promise<void>((resolve, reject) => {
                    let command = `git clone --progress --depth=1 https://git:***@github.com/${repo.owner}/${repo.name} .`;
                    this.consolePrint('clone', { type: 'stdout', full: true, data: `$> ${command}` });
                    this.consolePrint('clone', { type: 'stdout', full: false, data: `$> ${command}` });
                    command = command.replaceAll('***', token);
                    const hook = exec(command, {
                        cwd: workingDirectory
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.consolePrint('clone', { type: 'stdout', full: true, data: stdout });
                        this.consolePrint('clone', { type: 'stderr', full: true, data: stderr });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.consolePrint('clone', { type: 'stdout', full: false, data });
                    });
                    hook.stderr?.on('data', (data) => {
                        this.consolePrint('clone', { type: 'stderr', full: false, data });
                    });
                }).then(async () => new Promise<void>((resolve, reject) => {
                    const command = `git reset --hard ${after}`;
                    this.consolePrint('fetch', { type: 'stdout', full: true, data: `$> ${command}` });
                    this.consolePrint('fetch', { type: 'stdout', full: false, data: `$> ${command}` });
                    const hook = exec(command, {
                        cwd: workingDirectory
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.consolePrint('fetch', { type: 'stdout', full: true, data: stdout });
                        this.consolePrint('fetch', { type: 'stderr', full: true, data: stderr });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.consolePrint('fetch', { type: 'stdout', full: false, data });
                    });
                    hook.stderr?.on('data', (data) => {
                        this.consolePrint('fetch', { type: 'stderr', full: false, data });
                    });
                })).then(async () => {

                    if (fs.existsSync(path.join(workingDirectory, 'yarn.lock')))
                        packageManager = 'yarn';
                    else if (fs.existsSync(path.join(workingDirectory, 'package-lock.json')))
                        packageManager = 'npm';
                    else if (fs.existsSync(path.join(workingDirectory, 'Cargo.lock')) || fs.existsSync(path.join(workingDirectory, 'Cargo.toml')))
                        packageManager = 'cargo';

                    this.listeners['message']?.forEach(listener => listener({ type: 'progress', sourceType: packageManager === 'cargo' ? 'rust-component' : 'assemblyscript', stage: 'install', output: { type: 'stdout', full: false, time: new Date().toISOString(), data: `Using ${packageManager} as package manager\r` } }));

                    return new Promise<void>((resolve, reject) => {
                        const command = packageManagerCommands[packageManager][0];
                        this.consolePrint('install', { type: 'stdout', full: true, data: `$> ${command}` });
                        this.consolePrint('install', { type: 'stdout', full: false, data: `$> ${command}` });
                        const hook = exec(command, {
                            cwd: workingDirectory
                        }, (error, stdout, stderr) => {
                            if (error) return reject(error);
                            this.consolePrint('install', { type: 'stdout', full: true, data: stdout });
                            this.consolePrint('install', { type: 'stderr', full: true, data: stderr });
                            resolve();
                        });
                        hook.stdout?.on('data', (data) => {
                            this.consolePrint('install', { type: 'stdout', full: false, data });
                        });
                        hook.stderr?.on('data', (data) => {
                            this.consolePrint('install', { type: 'stderr', full: false, data });
                        });
                    });
                }).then(async () => new Promise<void>((resolve, reject) => {
                    const command = packageManagerCommands[packageManager][1];
                    this.consolePrint('build', { type: 'stdout', full: true, data: `$> ${command}` });
                    this.consolePrint('build', { type: 'stdout', full: false, data: `$> ${command}` });
                    const hook = exec(command, {
                        cwd: workingDirectory,
                        env: {
                            ...process.env,
                            INIT_CWD: workingDirectory,
                            PATH: process.env['PATH'],
                            PATHEXT: process.env['PATHEXT'],
                            HOMEPATH: process.env['HOMEPATH'],
                            HOME: process.env['HOME'],
                            RUSTUP_HOME: process.env['RUSTUP_HOME'],
                            RUSTUP_TOOLCHAIN: process.env['RUSTUP_TOOLCHAIN'],
                            CARGO_HOME: process.env['CARGO_HOME'],
                            CARGO_TARGET_DIR: process.env['CARGO_TARGET_DIR'],
                            RUSTFLAGS: `${process.env['RUSTFLAGS'] ?? ''} \
                            --remap-path-prefix ${workingDirectory}=/klave \
                            --remap-path-prefix ${process.env['CARGO_HOME']}=/klave/.cargo
                            --remap-path-prefix ${process.env['RUSTUP_HOME']}=/klave/.rustup`
                        }
                    }, (error, stdout, stderr) => {
                        if (error) return reject(error);
                        this.consolePrint('build', { type: 'stdout', full: true, data: stdout });
                        this.consolePrint('build', { type: 'stderr', full: true, data: stderr });
                        resolve();
                    });
                    hook.stdout?.on('data', (data) => {
                        this.consolePrint('build', { type: 'stdout', full: false, data });
                    });
                    hook.stderr?.on('data', (data) => {
                        this.consolePrint('build', { type: 'stderr', full: false, data });
                    });
                })).then(async () => new Promise<PackageManager>((resolve, reject) => {

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

                    resolve(packageManager);

                })).then(async (packageManager) => {
                    this.listeners['message']?.forEach(listener => listener({ type: 'done', stats: {}, sourceType: packageManager === 'cargo' ? 'rust-component' : 'assemblyscript', output: this.outputProgress, dependencies: this.usedDependencies }));
                }).catch(async (error) => {
                    // Leave a bit of time for the last buffered process message to be committed
                    setTimeout(() => {
                        const finalError = error instanceof Error ? error : new Error(error?.toString() ?? 'Unknown error');
                        this.listeners['message']?.forEach(listener => listener({ type: 'errored', error: finalError, sourceType: packageManager === 'cargo' ? 'rust-component' : 'assemblyscript', output: this.outputProgress }));
                    }, 5000);
                });
            }

            catch (e) {
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

    return buildHost;
};
