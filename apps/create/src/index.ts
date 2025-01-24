import { Command } from 'commander';
import chalk from 'chalk';
import spawnAsync from '@expo/spawn-async';
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { replaceInFile } from 'replace-in-file';
import { findGitHubEmail, findGitHubProfileUrl, findMyName, guessRepoUrl, isEmpty, isValidName, createTerminalLink } from '~/lib/utils';
import { resolvePackageManager } from '~/lib/resolve-package-manager';
import latestVersion from 'latest-version';
import { DOCS_URL, KLAVE_PLATFORM_URL, DISCORD_URL } from '~/lib/constants';
import { SubstitutionData } from '~/lib/types';
import sanitize from 'sanitize-filename';
import validateNpmPackage from 'validate-npm-package-name';
import packageJson from '../package.json';
import { KLAVE_CYAN_BG, KLAVE_LIGHT_BLUE } from '~/lib/constants';

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

async function main() {

    console.log('\n');
    p.intro(KLAVE_CYAN_BG(chalk.bold.black(' Klave - The honest-by-design platform ')));
    p.note('Welcome to Klave. Let\'s create your honest application!');

    const appInfo = await p.group(
        {
            // Ask for the directory to create the project in
            dir: async () => p.text({
                message: 'Where should we create your project?',
                initialValue: './my-honest-app',
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
            }),
            // Ask for the name of the project
            name: async () => p.text({
                message: 'What is the name of your honest application?',
                initialValue: 'hello-world',
                validate(value) {
                    if (value.length === 0)
                        return 'Project name is required';
                    if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                        return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
                    return;
                }
            }),
            // Ask for the description of the project
            description: async () => p.text({
                message: 'How would you describe your honest application?',
                initialValue: 'This is an honest application for the Klave Network',
                validate(value) {
                    if (value.length === 0)
                        return 'Project description is required.';
                    return;
                }
            }),
            // Ask for the author name
            authorName: async () => p.text({
                message: 'What is the name of the author?',
                initialValue: await findMyName(),
                validate(value) {
                    if (value.length === 0)
                        return 'Author name is required.';
                    return;
                }
            }),
            // Ask for the author email
            authorEmail: async () => p.text({
                message: 'What is the email address of the author?',
                initialValue: await findGitHubEmail(),
                validate(value) {
                    if (value.length === 0)
                        return 'Author email is required.';
                    return;
                }
            }),
            // Ask for the author URL
            authorUrl: async ({ results }) => p.text({
                message: 'What is the URL to the author\'s GitHub profile?',
                initialValue: await findGitHubProfileUrl(results.authorEmail as string),
                validate(value) {
                    if (value.length === 0)
                        return 'Author URL is required.';
                    return;
                }
            }),
            // Ask for the repository URL
            repo: async ({ results }) => p.text({
                message: 'What is the URL for the repository?',
                initialValue: await guessRepoUrl(results.authorUrl as string, results.dir as string),
                validate(value) {
                    if (value.length === 0)
                        return 'Repository URL is required.';
                    return;
                }
            }),
            // Ask if the user wants to install dependencies
            installDeps: async () => p.confirm({
                message: 'Install dependencies?'
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

    const { installDeps, dir, name, description, authorName, authorEmail, authorUrl, repo } = appInfo;

    const targetDir = path.join(CWD, dir);
    const packageManager = resolvePackageManager();

    await fs.ensureDir(dir);
    await confirmTargetDirAsync(dir);

    // Create the project template
    await createTemplateAsync(targetDir, {
        project: {
            slug: name as string,
            version: '0.0.1',
            description: description as string
        },
        author: `${authorName as string} <${authorEmail as string}> (${authorUrl as string})`,
        license: 'MIT',
        repo: repo as string
    });

    // Create the Git repository
    await createGitRepoAsync(targetDir);

    if (installDeps) {
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

    const buildCmd = packageManager === 'yarn' ? 'build' : 'run build';
    const installLegacyDeps = packageManager === 'npm' ? '--legacy-peer-deps' : '';
    const nextSteps = `
Build your application:

    - Enter your project directory using ${KLAVE_LIGHT_BLUE(chalk.bold(`cd ${dir}`))}
    ${installDeps ? 'EMPTY_LINE' : `- To install dependencies, run ${KLAVE_LIGHT_BLUE(chalk.bold(`${packageManager} install ${installLegacyDeps}`))}`}
    - To build your application, run ${KLAVE_LIGHT_BLUE(chalk.bold(`${packageManager} ${buildCmd}`))}
    - Log in to ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('Klave', KLAVE_PLATFORM_URL)))} to deploy your application

Documentation

    - Learn more about Klave ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', DOCS_URL)))}
    `.replace(/EMPTY_LINE\n?/g, ''); // Remove unnecessary blank lines;

    p.note(nextSteps, KLAVE_CYAN_BG(chalk.bold.black(' Next steps ')));

    p.outro(`Stuck? Reach out to us on ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('Discord', DISCORD_URL)))}`);
}

/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 */
async function confirmTargetDirAsync(targetDir: string): Promise<void> {
    const files = await fs.readdir(targetDir);

    if (files.length === 0) {
        return;
    }
    const shouldContinue = await p.confirm({
        message: `The target directory ${chalk.magenta(
            targetDir
        )} is not empty, do you want to continue anyway?`
    });

    if (p.isCancel(shouldContinue)) return process.exit();
}

/**
 * Create an empty Git repository.
 */
async function createGitRepoAsync(targetDir: string) {
    const s = p.spinner();
    s.start('Creating an empty Git repository');

    await spawnAsync('git', ['init'], {
        cwd: targetDir,
        stdio: 'ignore'
    });

    s.stop('Created an empty Git repository');
}

/**
 * Create template files.
 */
async function createTemplateAsync(targetDir: string, data: SubstitutionData) {
    const s = p.spinner();
    s.start('Creating template files');

    const sourceDir = path.join(dirname, '..', 'template', '.');
    await fs.copy(sourceDir, targetDir, {
        filter: () => true,
        overwrite: false,
        errorOnExist: true
    });

    const gitignoreFile = path.join(targetDir, 'gitignore');
    if (fs.existsSync(gitignoreFile)) {
        fs.renameSync(gitignoreFile, path.join(targetDir, '.gitignore'));
    }

    await replaceInFile({
        files: path.join(targetDir, 'klave.json'),
        from: [/{{KLAVE_APP_SLUG}}/g, /{{KLAVE_APP_DESCRIPTION}}/g, /{{KLAVE_APP_VERSION}}/g],
        to: [data.project.slug, data.project.description, data.project.version],
        disableGlobs: true
    });

    await replaceInFile({
        files: path.join(targetDir, 'package.json'),
        from: [/{{KLAVE_APP_SLUG}}/g, /{{KLAVE_APP_DESCRIPTION}}/g, /{{KLAVE_APP_VERSION}}/g, /{{KLAVE_APP_AUTHOR}}/g, /{{KLAVE_APP_LICENSE}}/g, /{{KLAVE_APP_REPO}}/g],
        to: [data.project.slug, data.project.description, data.project.version, data.author, data.license, data.repo],
        disableGlobs: true
    });

    const latestSDK = await latestVersion('@klave/sdk');

    await replaceInFile({
        files: path.join(targetDir, 'package.json'),
        from: [/{{KLAVE_SDK_CURRENT_VERSION}}/g],
        to: [latestSDK ?? '*'],
        disableGlobs: true
    });

    await fs.rename(path.join(targetDir, 'apps', 'hello_world'), path.join(targetDir, 'apps', data.project.slug));
    s.stop('Template files created successfully');
}

const program = new Command();

program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .arguments('[path]')
    .action(main);

program.parse(process.argv);
