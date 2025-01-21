import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import { KLAVE_LIGHT_BLUE, PACKAGE_NAME, PACKAGE_VERSION } from './lib/constants';
import { parseArguments } from './utils/parse-args';
import { createTerminalLink } from './utils/helpers';

// commands
import info from './commands/info';
import apps from './commands/apps';
import { help } from './commands/help';

const main = async () => {

    // Check if 'klave.json' exists at the beginning
    const klaveConfigPath = path.join(process.cwd(), 'klave.json');

    if (!fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red(`
Error: This is not a Klave project. Missing klave.json file. To scaffold a new project, run:

- <your package manager of choice> create on-klave

Read more ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', 'https://docs.klave.com/quickstart/create')))}
        `));
        process.exit(1); // Exit with an error code if klave.json is missing
    }

    console.log('\n');
    console.log(chalk.dim(`${PACKAGE_NAME} v${PACKAGE_VERSION}`));
    console.log('Welcome to Klave CLI. The honest-by-design platform.');
    console.log('\n');

    const args = parseArguments();
    const command = args._[0];

    switch (command) {
        case 'info':
            await info();
            break;
        case 'apps':
            await apps();
            break;
        case 'version':
            console.log(PACKAGE_VERSION);
            break;
        default:
            if (args['--help']) {
                help();
            } else {
                console.log(chalk.red('Unknown command! Use --help for available commands.'));
            }
    }
};

main()
    .catch((err) => {
        console.error(`An unexpected error occurred!\n${err.stack}`);
        process.exit(1);
    });
