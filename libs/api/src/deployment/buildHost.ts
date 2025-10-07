import { exec, ExecException } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import mime from 'mime';
import TOML from 'smol-toml';
import { logger, objectStore, Upload, PutObjectOutput } from '@klave/providers';
import { config, getFinalParseConfig, StagedOutputGroups } from '@klave/constants';
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
} | {
    type: 'expand';
    feature: 'ui';
};

type MinimalTOMLConfig = {
    dependencies?: Record<string, string>;
    package?: {
        name?: string;
        metadata?: {
            component?:
            Record<string, string>
        }
    }
}

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

                const { token, workingDirectory, repo, context: { commit: { after } }, deployment } = this.options;
                type PackageManager = 'yarn' | 'npm' | 'cargo';
                const packageManagerCommands: Record<PackageManager, [string[], string[]]> = {
                    yarn: [['yarn install'], ['yarn build']],
                    npm: [['npm install'], ['npm run build']],
                    cargo: [['cargo component bindings'], ['cargo component build --target wasm32-unknown-unknown --release']]
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
                        const commands = packageManagerCommands[packageManager][0];
                        const command = commands.join(' && ');
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
                    const commands = packageManagerCommands[packageManager][1];
                    const command = commands.join(' && ');
                    this.consolePrint('build', { type: 'stdout', full: true, data: `$> ${command}` });
                    this.consolePrint('build', { type: 'stdout', full: false, data: `$> ${command}` });
                    const env = Object.fromEntries(Object.entries({
                        ...process.env,
                        INIT_CWD: workingDirectory,
                        PATH: config.get('PATH'),
                        PATHEXT: config.get('PATHEXT'),
                        HOMEPATH: config.get('HOMEPATH'),
                        HOME: config.get('HOME'),
                        RUSTUP_HOME: config.get('RUSTUP_HOME'),
                        RUSTUP_TOOLCHAIN: config.get('RUSTUP_TOOLCHAIN'),
                        CARGO_HOME: config.get('CARGO_HOME'),
                        CARGO_TARGET_DIR: config.get('CARGO_TARGET_DIR'),
                        RUSTFLAGS: `${config.get('RUSTFLAGS')} \
                            --remap-path-prefix ${workingDirectory}=/klave \
                            --remap-path-prefix ${config.get('CARGO_HOME')}=/klave/.cargo
                            --remap-path-prefix ${config.get('RUSTUP_HOME')}=/klave/.rustup`
                    }).filter(([, value]) =>
                        value !== undefined && value !== null && value !== ''
                    ));
                    const hook = exec(command, {
                        cwd: workingDirectory,
                        env
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

                    const appConfig = klaveConfig.data.applications?.[appIndex];
                    const appPath = appConfig?.rootDir ?? '.';

                    if (packageManager === 'yarn' || packageManager === 'npm') {
                        const appCompiledPath = path.join(workingDirectory, '.klave');
                        fs.readdirSync(appCompiledPath).forEach(file => {
                            if (file.split('-').shift() === `${appIndex}`)
                                this.listeners['message']?.forEach(listener => listener({
                                    type: 'write',
                                    contents: Uint8Array.from(fs.readFileSync(path.join(appCompiledPath, file), null)),
                                    filename: path.basename(file)
                                }));
                        });
                    } else if (packageManager === 'cargo') {

                        const tomlConf: MinimalTOMLConfig = TOML.parse(fs.readFileSync(path.join(workingDirectory, appPath, 'Cargo.toml'), 'utf-8'));

                        Object.entries(tomlConf['dependencies'] ?? {})?.forEach(([name, version]) => {
                            this.usedDependencies[name] = {
                                version: (typeof version === 'string' ? version : (version as { version: string }).version) ?? 'unknown',
                                digests: {}
                            };
                        });
                        const witRelativePath: string = tomlConf?.['package']?.['metadata']?.['component']?.['wit-path'] ?? 'wit';
                        const witPath: string = path.resolve(path.join(workingDirectory, appPath, witRelativePath));
                        const witEntries = fs.readdirSync(witPath, { withFileTypes: true });
                        const witWorld: string | undefined = tomlConf?.['package']?.['metadata']?.['component']?.['world'];

                        let firstWorld: string | undefined;
                        let foundWitWorld = false;
                        for (const entry of witEntries) {

                            if (foundWitWorld)
                                break;
                            if (!entry.isFile() || !entry.name.endsWith('.wit'))
                                continue;

                            const witFilePath = path.join(witPath, entry.name);
                            const witContents = fs.readFileSync(witFilePath, 'utf-8').toString();
                            const worldReg = /^\s*?world\s+([\w-]+)\s*{(.*?)}/gsm;
                            const worldMatches = Array.from(witContents.matchAll(worldReg));

                            for (const m of worldMatches) {
                                if (foundWitWorld)
                                    break;
                                const [worldDefinition, worldName] = m;
                                if (!worldDefinition || !worldName)
                                    return;
                                if (!firstWorld)
                                    firstWorld = worldDefinition.trim();
                                if (worldName.trim() === witWorld) {
                                    foundWitWorld = true;
                                    this.listeners['message']?.forEach(listener => listener({
                                        type: 'write',
                                        contents: Buffer.from(worldDefinition.trim()),
                                        filename: entry.name
                                    }));
                                }
                            }
                        }

                        if (!foundWitWorld && firstWorld)
                            this.listeners['message']?.forEach(listener => listener({
                                type: 'write',
                                contents: Buffer.from(firstWorld),
                                filename: 'world.wit'
                            }));

                        const appCompiledPath = path.join(workingDirectory, 'target', 'wasm32-unknown-unknown', 'release');
                        fs.readdirSync(appCompiledPath).forEach(file => {
                            const filename = file.split('.').shift();
                            if (filename === tomlConf?.['package']?.['name'] || filename === tomlConf?.['package']?.['name']?.replaceAll('-', '_'))
                                this.listeners['message']?.forEach(listener => listener({
                                    type: 'write',
                                    contents: Uint8Array.from(fs.readFileSync(path.join(appCompiledPath, file), null)),
                                    filename: file
                                }));
                        });
                    }
                    const appUiPath = path.normalize(path.join(workingDirectory, appPath, appConfig?.ui ?? 'ui'));
                    let fileUploads: Array<Promise<PutObjectOutput | null>> = [];
                    if (fs.existsSync(appUiPath)) {
                        logger.debug(`Found UI artifacts for ${deployment.id}`, {
                            parent: 'bmv'
                        });
                        this.listeners['message']?.forEach(listener => listener({
                            type: 'expand',
                            feature: 'ui'
                        }));
                        try {
                            const dirContents = fs.readdirSync(appUiPath, { recursive: true, withFileTypes: true });
                            fileUploads = dirContents.map(async file => {
                                if (!file.isFile())
                                    return Promise.resolve(null);
                                const normedPath = path.normalize(path.join(file.parentPath, file.name));
                                const normedKey = path.normalize(`${deployment.id}/${normedPath.replace(/\\/g, '/').replace(appUiPath.replace(/\\/g, '/'), '')}`).replace(/\\/g, '/');
                                if (!fs.existsSync(normedPath))
                                    return Promise.resolve(null);
                                const fileStream = fs.createReadStream(normedPath);
                                const fileUpload = new Upload({
                                    client: objectStore,
                                    params: {
                                        Bucket: config.get('KLAVE_BHDUI_S3_BUCKET_NAME'),
                                        Key: normedKey,
                                        Body: fileStream,
                                        ContentType: mime.lookup(normedPath) ?? 'application/octet-stream'
                                    },
                                    leavePartsOnError: false
                                });
                                return fileUpload.done();
                            });
                        } catch (error) {
                            logger.error(`Error uploading UI artifacts for ${deployment.id}: ${error}`, {
                                parent: 'bmv'
                            });
                        }
                    }

                    Promise.allSettled(fileUploads)
                        .then((fileUploadResults) => {
                            if (fileUploadResults.filter(result => result.status === 'rejected').length > 0)
                                logger.debug(`Some UI artifacts failed to upload ${deployment.id}`, {
                                    parent: 'bmv'
                                });
                            resolve(packageManager);
                        }).catch((error) => {
                            logger.error(`Error uploading UI artifacts for ${deployment.id}: ${error}`, {
                                parent: 'bmv'
                            });
                        });

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
    const workingDirectory = path.join(config.get('NODE_ENV') === 'development' ? process.cwd() : '/', 'tmp', '.klave', 'buildHost', compilationId);

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
