import { runCli } from './main';
import path from 'node:path';
import fs from 'fs-extra';
import { KLAVE_LIGHT_BLUE } from './lib/constants';
import chalk from 'chalk';
import { createTerminalLink } from './utils/helpers';

const main = async () => {

    // Checks if file klave.json exists
    const klaveConfigPath = path.join(process.cwd(), 'klave.json');

    if (!fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red(`
Error: This is not a Klave project. Missing klave.json file. To scaffold a new project, run:

- klave create

Read more ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('here', 'https://docs.klave.com/quickstart/create')))}
        `));
        process.exit(1); // Exit with an error code if klave.json is missing
    }

    await runCli();
};

main();
