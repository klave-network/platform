import { KLAVE_CYAN_BG, KLAVE_LIGHT_BLUE } from '../lib/constants';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'fs-extra';
import spawnAsync from '@expo/spawn-async';
import * as p from '@clack/prompts';
import { findMyName, findGitHubEmail, guessRepoUrl, findGitHubProfileUrl } from '../utils/git';
import { isEmpty, isValidName, createTerminalLink } from '../utils/helpers';
import { createTemplateAsync } from '../utils/create-template';
import validateNpmPackage from 'validate-npm-package-name';
import sanitize from 'sanitize-filename';
import { resolvePackageManager } from '../utils/resolve-package-manager';
import { confirmTargetDirAsync } from '../utils/confirm-target-dir';
import { DOCS_URL, KLAVE_PLATFORM_URL, DISCORD_URL } from '../lib/constants';
import { CreateOptions } from '../lib/types';

type CreateType = CreateOptions & {
    dir?: string;
};

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

export const create = async ({ name, template, noGit, noInstall, dir }: CreateType) => {

    // Checks if file klave.json exists
    const klaveConfigPath = path.join(CWD, 'klave.json');

    if (fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red(`
Error: Found klave.json file. Looks like you already are in a Klave project. To add a new app to your project, run:

- klave add

Read more ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', 'https://docs.klave.com/quickstart/create')))}
        `));
        process.exit(1); // Exit with an error code if klave.json is found
    }

    console.log('\n');
    p.intro(KLAVE_CYAN_BG(chalk.bold.black(' Klave - The honest-by-design platform ')));
    p.note('Welcome to Klave. Let\'s create your honest application!');

    // First, determine the template type early so we can conditionally show prompts
    let projectTemplate: 'typescript' | 'rust';
    
    if (!template) {
        const templateResponse = await p.select({
            message: 'What language would you like to use?',
            options: [
                { value: 'typescript', label: 'TypeScript' },
                { value: 'rust', label: 'Rust' }
            ]
        });
        
        if (p.isCancel(templateResponse)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        
        projectTemplate = templateResponse as 'typescript' | 'rust';
    } else {
        projectTemplate = template as 'typescript' | 'rust';
    }

    const appInfo = await p.group(
        {
            // Ask for the directory to create the project in
            ...(!dir && {
                directory: async () => p.text({
                    message: 'Where should we create your project?',
                    placeholder: './my-honest-app',
                    validate(value) {
                        if (!value)
                            return 'Please enter a path.';

                        if (value[0] !== '.')
                            return 'Please enter a relative path.';

                        if (!isEmpty(value))
                            return 'Directory is not empty!';

                        let normalizedSlug;
                        if (value === '.' || value === './') {
                            const parts = process.cwd().split(path.sep);
                            normalizedSlug = parts[parts.length - 1];
                        } else if (value.startsWith('./') || value.startsWith('../')) {
                            const parts = value.split('/');
                            normalizedSlug = parts[parts.length - 1];
                        }

                        if (!isValidName(normalizedSlug ?? ''))
                            return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';

                        return;
                    }
                })
            }),
            // Ask for the name of the app
            ...(!name && {
                appName: async () => p.text({
                    message: 'What is the name of your honest application?',
                    placeholder: 'hello-world',
                    validate(value) {
                        if (value.length === 0)
                            return 'Project name is required';
                        if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                            return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
                        return;
                    }
                })
            }),
            // Ask for the description of the project
            description: async () => p.text({
                message: 'How would you describe your honest application?',
                placeholder: 'This is an honest application for the Klave Network',
                validate(value) {
                    if (value.length === 0)
                        return 'Project description is required.';
                    return;
                }
            }),
            // Ask for the author name
            authorName: async () => p.text({
                message: 'What is the name of the author?',
                placeholder: await findMyName(),
                validate(value) {
                    if (value.length === 0)
                        return 'Author name is required.';
                    return;
                }
            }),
            // Ask for the author email
            authorEmail: async () => p.text({
                message: 'What is the email address of the author?',
                placeholder: await findGitHubEmail(),
                validate(value) {
                    if (value.length === 0)
                        return 'Author email is required.';
                    return;
                }
            }),
            // Ask for the author URL
            authorUrl: async ({ results }) => p.text({
                message: 'What is the URL to the author\'s GitHub profile?',
                placeholder: await findGitHubProfileUrl(results.authorEmail as string),
                validate(value) {
                    if (value.length === 0)
                        return 'Author URL is required.';
                    return;
                }
            }),
            // Ask for the repository URL
            repo: async ({ results }) => p.text({
                message: 'What is the URL for the repository?',
                placeholder: await guessRepoUrl(results.authorUrl as string, (dir ?? results.directory) as string),
                validate(value) {
                    if (value.length === 0)
                        return 'Repository URL is required.';
                    return;
                }
            }),
            // Ask if the user wants to initialize a git repository
            ...(!noGit && {
                initGit: async () => p.confirm({
                    message: 'Initialize a git repository?'
                })
            }),
            // Ask if the user wants to install dependencies - only for TypeScript
            ...(!noInstall && projectTemplate === 'typescript' && {
                installDeps: async () => p.confirm({
                    message: 'Install dependencies?',
                    initialValue: true
                })
            })
        },
        {
            // On Cancel callback that wraps the group
            // So if the user cancels one of the prompts in the group this function will be called
            onCancel: () => {
                p.cancel('Operation cancelled.');
                process.exit(0);
            }
        }
    );

    const {
        installDeps,
        initGit,
        directory,
        appName,
        description,
        authorName,
        authorEmail,
        authorUrl,
        repo
    } = appInfo;

    const projectDir = (dir ?? directory) as string;
    const projectName = name ?? appName as string;

    const targetDir = path.join(CWD, projectDir);
    const packageManager = resolvePackageManager();

    await fs.ensureDir(projectDir);
    await confirmTargetDirAsync(projectDir);

    // Create the project template
    await createTemplateAsync(targetDir, {
        project: {
            slug: projectName,
            version: '0.0.1',
            description: description as string
        },
        author: `${authorName as string} <${authorEmail as string}> (${authorUrl as string})`,
        license: 'MIT',
        repo: repo as string
    }, projectTemplate);

    // Initialize the git repository
    if (initGit) {
        const s = p.spinner();
        s.start('Creating an empty Git repository');

        await spawnAsync('git', ['init'], {
            cwd: targetDir,
            stdio: 'ignore'
        });

        s.stop('Created an empty Git repository');
    }

    // Install dependencies - only for TypeScript projects
    if (installDeps && projectTemplate === 'typescript') {
        const s = p.spinner();
        s.start(`Installing via ${packageManager}`);

        let args = ['install', '--legacy-peer-deps'];

        if (packageManager === 'yarn') {
            args = [];
        } else if (packageManager === 'pnpm') {
            args = [];
        }

        await spawnAsync(packageManager, args, {
            cwd: targetDir,
            stdio: 'ignore'
        });

        s.stop(`Installed via ${packageManager}`);
    }

    // Show appropriate next steps based on the selected template
    let nextSteps: string;
    
    if (projectTemplate === 'rust') {
        nextSteps = `
Build your Rust application:

    - Enter your project directory using ${KLAVE_LIGHT_BLUE(chalk.bold(`cd ${projectDir}`))}
    - Make sure you have Rust toolchain installed: ${KLAVE_LIGHT_BLUE(chalk.bold('rustup target add wasm32-unknown-unknown'))}
    - Make sure you have cargo-component installed: ${KLAVE_LIGHT_BLUE(chalk.bold('cargo install cargo-component'))}
    - To build your application, run ${KLAVE_LIGHT_BLUE(chalk.bold('cargo component build --target wasm32-unknown-unknown --release'))}
    - Log in to ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('Klave', KLAVE_PLATFORM_URL)))} to deploy your application

Documentation

    - Learn more about Klave ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', DOCS_URL)))}
    `;
    } else {
        // TypeScript instructions
        const buildCmd = packageManager === 'yarn' ? 'build' : 'run build';
        const installLegacyDeps = packageManager === 'npm' ? '--legacy-peer-deps' : '';
        
        nextSteps = `
Build your TypeScript application:

    - Enter your project directory using ${KLAVE_LIGHT_BLUE(chalk.bold(`cd ${projectDir}`))}
    ${installDeps ? 'EMPTY_LINE' : `- To install dependencies, run ${KLAVE_LIGHT_BLUE(chalk.bold(`${packageManager} install ${installLegacyDeps}`))}`}
    - To build your application, run ${KLAVE_LIGHT_BLUE(chalk.bold(`${packageManager} ${buildCmd}`))}
    - Log in to ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('Klave', KLAVE_PLATFORM_URL)))} to deploy your application

Documentation

    - Learn more about Klave ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', DOCS_URL)))}
    `.replace(/EMPTY_LINE\n?/g, ''); // Remove unnecessary blank lines
    }

    p.note(nextSteps, KLAVE_CYAN_BG(chalk.bold.black(' Next steps ')));

    p.outro(`Stuck? Reach out to us on ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('Discord', DISCORD_URL)))}`);
};