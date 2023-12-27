import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import rif from 'replace-in-file';
import { getSlugPrompt, getSubstitutionDataPrompts } from './lib/prompts';
import {
    PackageManagerName,
    resolvePackageManager
} from './lib/resolvePackageManager';
import type { CommandOptions, SubstitutionData } from './lib/types';
import { newStep } from './lib/utils';
import packageJson from '../package.json';
import latestVersion from 'latest-version';

const { replaceInFile } = rif;
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

// Docs URL
const DOCS_URL = 'https://klave.com/docs';

/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param command An object from `commander`.
 */
async function main(target: string | undefined, options: CommandOptions) {
    const slug = await askForPackageSlugAsync(target);
    const targetDir = path.join(CWD, target || slug);

    await fs.ensureDir(targetDir);
    await confirmTargetDirAsync(targetDir);

    options.target = targetDir;

    const data = await askForSubstitutionDataAsync(slug);
    // await askForSubstitutionDataAsync(slug);

    // Make one line break between prompts and progress logs
    console.log();

    const packageManager = await resolvePackageManager();
    const packagePath = options.source
        ? path.join(CWD, options.source)
        // : await downloadPackageAsync(targetDir);
        : await createTemplateAsync(targetDir, data);

    await newStep('Installing dependencies', async (step) => {
        try {
            await spawnAsync('yarn', [], {
                cwd: targetDir,
                stdio: 'ignore'
            });
            step.succeed('Installing dependencies');
        } catch (e) {
            step.fail(e?.toString());
        }
    });

    await newStep('Creating an empty Git repository', async (step) => {
        try {
            await spawnAsync('git', ['init'], {
                cwd: targetDir,
                stdio: 'ignore'
            });
            step.succeed('Created an empty Git repository');
        } catch (e) {
            step.fail(e?.toString());
        }
    });

    if (!options.source) {
        // Files in the downloaded tarball are wrapped in `package` dir.
        // We should remove it after all.
        await fs.remove(packagePath);
    }
    if (!options.withReadme) {
        await fs.remove(path.join(targetDir, 'README.md'));
    }
    if (!options.withChangelog) {
        await fs.remove(path.join(targetDir, 'CHANGELOG.md'));
    }

    console.log();
    console.log('✅ Successfully created a Klave application');

    options.example = true;
    printFurtherInstructions(targetDir, packageManager, options.example);
}

/**
 * Create template files.
 */
async function createTemplateAsync(targetDir: string, data: SubstitutionData): Promise<string> {
    return await newStep('Creating template files', async (step) => {

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

        step.succeed('Creating template files');

        return path.join(targetDir, 'temp_dl_folder');
    });
}

/**
 * Asks the user for the package slug (npm package name).
 */
async function askForPackageSlugAsync(customTargetPath?: string): Promise<string> {
    const { slug } = await prompts(getSlugPrompt(customTargetPath), {
        onCancel: () => process.exit(0)
    });
    return slug;
}

/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 */
async function askForSubstitutionDataAsync(slug: string): Promise<SubstitutionData> {
    const promptQueries = await getSubstitutionDataPrompts(slug);

    // Stop the process when the user cancels/exits the prompt.
    const onCancel = () => {
        process.exit(0);
    };

    const {
        description,
        authorName,
        authorEmail,
        authorUrl,
        repo
    } = await prompts(promptQueries, { onCancel });

    return {
        project: {
            slug,
            version: '0.0.0',
            description
        },
        author: `${authorName} <${authorEmail}> (${authorUrl})`,
        license: 'MIT',
        repo
    };
}

/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 */
async function confirmTargetDirAsync(targetDir: string): Promise<void> {
    const files = await fs.readdir(targetDir);

    if (files.length === 0) {
        return;
    }
    const { shouldContinue } = await prompts(
        {
            type: 'confirm',
            name: 'shouldContinue',
            message: `The target directory ${chalk.magenta(
                targetDir
            )} is not empty, do you want to continue anyway?`,
            initial: true
        },
        {
            onCancel: () => false
        }
    );
    if (!shouldContinue) {
        process.exit(0);
    }
}

/**
 * Prints how the user can follow up once the script finishes creating the module.
 */
function printFurtherInstructions(
    targetDir: string,
    packageManager: PackageManagerName,
    includesExample: boolean
) {
    if (includesExample) {
        const commands = [
            `cd ${path.relative(CWD, targetDir)}`,
            `${packageManager} install`,
            'code .'
        ];

        console.log();
        console.log(
            'To start developing your honest application, navigate to the directory and open your favorite editor'
        );
        commands.forEach((command) => console.log(chalk.gray('>'), chalk.bold(command)));
        console.log();
    }
    console.log(`Visit ${chalk.blue.bold(DOCS_URL)} for the documentation on Klave`);
}

const program = new Command();

program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .arguments('[path]')
    .action(main);

program.parse(process.argv);