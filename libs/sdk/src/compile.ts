import * as fs from 'fs-extra';
import * as path from 'node:path';
import * as chalk from 'chalk';
import { posix as pathCompleteExtname } from 'path-complete-extname';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createCompiler, type CompilerHost } from '@klave/compiler';
import { klaveRcConfigurationSchema as schema } from './rc';

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env['INIT_CWD'] || process.cwd();

const compile = () => {
    try {

        const configContent = fs.readFileSync(path.join(CWD, 'klave.json')).toString();
        const parsingOutput = schema.safeParse(JSON.parse(configContent));

        if (parsingOutput.success)
            Promise.allSettled(parsingOutput.data.applications.map((app, index) =>
                new Promise<void>((resolve, reject) => {
                    const appPathRoot = path.join(CWD, app.rootDir ?? parsingOutput.data.rootDir ?? '.');
                    let appPath = path.join(appPathRoot, app.index ?? '');
                    if (!fs.existsSync(appPath) || !fs.statSync(appPath).isFile())
                        appPath = path.join(appPathRoot, 'index.ssc');
                    if (!fs.existsSync(appPath) || !fs.statSync(appPath).isFile())
                        appPath = path.join(appPathRoot, 'index.ssc.ts');
                    if (!fs.existsSync(appPath) || !fs.statSync(appPath).isFile())
                        appPath = path.join(appPathRoot, 'index.ts');
                    if (!fs.existsSync(appPath) || !fs.statSync(appPath).isFile())
                        console.error(`Could not read entry point for application ${chalk.green(app.name)}`);

                    console.error(`Compiling ${chalk.green(app.name)} from ${path.join('.', path.relative(CWD, appPath))}...`);
                    fs.mkdirSync(path.join(CWD, '.klave'), { recursive: true });

                    createCompiler().then((compiler: CompilerHost) => {
                        compiler.on('message', (message: any) => {
                            // if (message.type === 'start') {
                            //     ...
                            // }
                            if (message.type === 'read') {
                                if (process.env['DEBUG'] === 'true')
                                    console.debug('file_read_try:' + path.resolve(appPathRoot, message.filename));
                                fs.readFile(path.resolve(appPathRoot, message.filename)).then(contents => {
                                    compiler.postMessage({
                                        type: 'read',
                                        id: message.id,
                                        contents: contents.toString()
                                    });
                                }).catch(() => {
                                    compiler.postMessage({
                                        type: 'read',
                                        id: message.id,
                                        contents: null
                                    });
                                });
                            } else if (message.type === 'write') {
                                const ext = pathCompleteExtname(message.filename);
                                if (ext.endsWith('.js'))
                                    return;
                                fs.writeFileSync(`${path.join(CWD, '.klave', `${index.toString()}-${app.name.toLocaleLowerCase().replace(/\s/g, '-')}`)}${ext}`, message.contents);
                            } else if (message.type === 'diagnostic') {
                                console.log(message.diagnostics);
                            } else if (message.type === 'errored') {
                                compiler.terminate().finally(() => {
                                    reject(message.error);
                                });
                            } else if (message.type === 'done') {
                                resolve();
                            }
                        });
                    }).catch(reject);
                })))
                .then((results) => {
                    const erroredList = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
                    if (erroredList.length > 0) {
                        erroredList.forEach(result => console.error(result.reason));
                        process.exit(1);
                    } else
                        process.exit(0);
                });
        else
            console.error(parsingOutput.error.flatten());
    } catch (e) {
        console.error(e);
    }
};

compile();
