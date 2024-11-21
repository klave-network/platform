import { Command } from 'commander';
import chalk from 'chalk';
import spawnAsync from '@expo/spawn-async';
import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { replaceInFile } from 'replace-in-file';
import { findGitHubEmail, findGitHubProfileUrl, findMyName, guessRepoUrl } from '~/lib/utils';
import { resolvePackageManager } from '~/lib/resolve-package-manager';
import latestVersion from 'latest-version';
import { DOCS_URL } from '~/lib/constants';
import { SubstitutionData } from '~/lib/types';
import sanitize from 'sanitize-filename';
import validateNpmPackage from 'validate-npm-package-name';

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export function create() {
    const createCmd = new Command('create');

    createCmd.action(async () => {

        p.intro('Lets create your app');

        const appInfo = await p.group(
            {
                dir: async () => p.text({
                    message: 'Where should we create your project?',
                    placeholder: './sparkling-solid',
                    validate(value) {
                        if (!value) return 'Please enter a path.';
                        if (value[0] !== '.') return 'Please enter a relative path.';
                        return;
                    }
                }),
                name: async () => p.text({
                    message: 'What is the name of your honest application?',
                    placeholder: 'my-project',
                    validate(value) {
                        if (value.length === 0)
                            return 'Project name is required';
                        if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                            return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
                        return;
                    }
                }),
                description: async () => p.text({
                    message: 'How would you describe your honest application?',
                    initialValue: 'This is an honest application for the Klave Network',
                    validate(value) {
                        if (value.length === 0)
                            return 'Project description is required.';
                        return;
                    }
                }),
                authorName: async () => p.text({
                    message: 'What is the name of the author?',
                    initialValue: await findMyName(),
                    validate(value) {
                        if (value.length === 0)
                            return 'Author name is required.';
                        return;
                    }
                }),
                authorEmail: async () => p.text({
                    message: 'What is the email address of the author?',
                    initialValue: await findGitHubEmail(),
                    validate(value) {
                        if (value.length === 0)
                            return 'Author email is required.';
                        return;
                    }
                }),
                authorUrl: async ({ results }) => p.text({
                    message: 'What is the URL to the author\'s GitHub profile?',
                    initialValue: await findGitHubProfileUrl(results.authorEmail as string),
                    validate(value) {
                        if (value.length === 0)
                            return 'Author URL is required.';
                        return;
                    }
                }),
                repo: async ({ results }) => p.text({
                    message: 'What is the URL for the repository?',
                    initialValue: await guessRepoUrl(results.authorUrl as string, (results.dir as string).slice(2)),
                    validate(value) {
                        if (value.length === 0)
                            return 'Repository URL is required.';
                        return;
                    }
                }),
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

        await createTemplateAsync(dir, {
            project: {
                slug: name as string,
                version: '0.0.1',
                description: description as string
            },
            author: `${authorName as string} <${authorEmail as string}> (${authorUrl as string})`,
            license: 'MIT',
            repo: repo as string
        });

        if (installDeps) {
            const s = p.spinner();
            s.start(`Installing via ${packageManager}`);

            await spawnAsync(packageManager, [], {
                cwd: targetDir,
                stdio: 'ignore'
            });

            s.stop(`Installed via ${packageManager}`);
        }

        const nextSteps = `cd ${dir}        \n${installDeps ? '' : `${packageManager} install\n`}`;

        p.note(nextSteps, 'Next steps.');

        p.outro(`Visit ${chalk.blue.bold(DOCS_URL)} for the documentation on Klave`);
    });

    return createCmd;
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
