import { KLAVE_CYAN_BG } from '../lib/constants';
import chalk from 'chalk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import validateNpmPackage from 'validate-npm-package-name';
import sanitize from 'sanitize-filename';

type NewType = {
    template?: 'typescript' | 'rust';
    name?: string;
};

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export const add = async ({ template, name }: NewType) => {

    // Checks if file klave.json exists
    const klaveConfigPath = path.join(CWD, 'klave.json');

    // Check if the JSON file exists
    if (!fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red('Error: klave.json file not found. Make sure you are in a Klave project.'));
        process.exit(1);
    }

    // Read the current JSON file content
    const data = JSON.parse(fs.readFileSync(klaveConfigPath, 'utf-8'));

    // Validate the structure of the JSON file
    if (!data.applications || !Array.isArray(data.applications)) {
        console.error(chalk.red('Error: Invalid klave.json file structure.'));
        process.exit(1);
    }

    console.log('\n');
    p.intro(KLAVE_CYAN_BG(chalk.bold.black(' Klave - The honest-by-design platform ')));
    p.note('Let\'s add a new honest app to your project!');

    const appInfo = await p.group(
        {
            // Ask for the name of the app
            ...(!name && {
                appName: async () => p.text({
                    message: 'What is the name of your honest application?',
                    initialValue: 'hello-world',
                    validate(value) {
                        if (value.length === 0)
                            return 'Project name is required';
                        if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                            return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
                        return;
                    }
                })
            }),
            // Ask for the language of the app
            ...(!template && {
                template: async () => p.select({
                    message: 'What language would you like to use?',
                    options: [
                        { value: 'ts', label: 'TypeScript' },
                        { value: 'rs', label: 'Rust' }
                    ]
                })
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

    const appName = (name ?? appInfo.appName) as string;
    const appTemplate = template ?? appInfo.template;

    console.log(appTemplate);

    // Define paths
    const appsDir = path.join(CWD, 'apps');
    const templateDir = path.join(dirname, '../..', 'template', './apps/hello_world');
    const newAppDir = path.join(appsDir, appName);

    // Check if apps directory exists
    if (!fs.existsSync(appsDir)) {
        throw new Error('Apps directory not found. Make sure you are in a Klave project root directory.');
    }

    // Check if app already exists
    if (fs.existsSync(newAppDir)) {
        throw new Error(`App '${appName}' already exists.`);
    }

    // Copy template to new app directory
    await fs.copy(templateDir, newAppDir);

    // Add the new application object to the applications array
    data.applications.push({
        slug: appName,
        description: appInfo.description,
        version: '0.0.1',
        rootDir: `/apps/${appName}`
    });

    // Write the updated JSON back to the file
    fs.writeFileSync(klaveConfigPath, JSON.stringify(data, null, 4), 'utf-8');
    console.log(chalk.green(`✨ Successfully created app '${appName}'`));

};
