import { Command, Option } from 'commander';
import { PACKAGE_DESCRIPTION, PACKAGE_VERSION } from './lib/constants';
import { CreateOptions } from './lib/types';
import { isKlaveProject } from './utils/is-klave-project';

// commands
import { info } from './commands/info';
import { apps } from './commands/apps';
import { create } from './commands/create';
import { add } from './commands/add';

export const runCli = async () => {

    const program = new Command();

    // Set up the CLI
    program
        .name('klave')
        .version(PACKAGE_VERSION)
        .description(PACKAGE_DESCRIPTION);

    // Command: add
    program
        .command('add')
        .description('Create a new Klave application')
        .addOption(new Option('-t, --template <language>', 'choose a template').choices(['typescript', 'rust']))
        .addOption(new Option('-n, --name <name>', 'name of the app'))
        .action(async (options) => {
            isKlaveProject();
            await add({
                template: options.template,
                name: options.name
            });
        });

    // Command: create
    program
        .command('create')
        .description('Scaffold a new Klave project')
        .addOption(new Option('-t, --template <language>', 'choose a template').choices(['typescript', 'rust']))
        .addOption(new Option('-n, --name <name>', 'name of the app'))
        .option('--noInstall', 'skip installing dependencies', false)
        .option('--noGit', 'skip initializing a new git repo in the project', false)
        .action(async (_name: string, options: CreateOptions) => {
            await create({
                name: options.name,
                template: options.template,
                noGit: options.noGit,
                noInstall: options.noInstall
            });
        });

    // Command: build
    program
        .command('build')
        .description('Build a Klave application')
        .action(() => {
            isKlaveProject();
            console.log('Building the Klave application...');
            // Implementation for building will go here
        });

    // Command: login
    program
        .command('login')
        .description('Log in to Klave')
        .action(() => {
            console.log('Logging in to Klave...');
            // Implementation for login will go here
        });

    // Command: deploy
    program
        .command('deploy')
        .description('Deploy a Klave application')
        .action(() => {
            isKlaveProject();
            console.log('Deploying the Klave application...');
            // Implementation for deployment will go here
        });

    // Command: apps
    program
        .command('apps')
        .description('Print information about Klave apps in the current project')
        .action(async () => {
            isKlaveProject();
            await apps();
        });

    // Command: info
    program
        .command('info')
        .description('Print information about the system and project dependencies')
        .action(async () => {
            isKlaveProject();
            await info();
        });

    await program.parseAsync(process.argv);
};
