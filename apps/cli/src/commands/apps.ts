import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { KLAVE_APP } from '~/lib/constants';

/**
 * Print out information about the Klave project
 */
export const apps = async () => {
    const klaveConfigPath = path.join(process.cwd(), 'klave.json');

    // Read and parse the klave.json file
    try {
        const klaveConfig = await fs.readJson(klaveConfigPath);

        // Validate the klave.json structure
        if (!klaveConfig.version || !Array.isArray(klaveConfig.applications)) {
            console.error(chalk.red('Error: Invalid klave.json format. Missing required properties.'));
            process.exit(1);
        }

        // Display version and applications
        console.log(`Version: ${chalk.bold(klaveConfig.version)}`);
        console.log('Applications:');
        klaveConfig.applications.forEach((app: KLAVE_APP, index: number) => {
            console.log(`  ${index + 1}. Name: ${chalk.bold(app.slug)}`);
            console.log(`     Description: ${chalk.bold(app.description)}`);
            console.log(`     Version: ${chalk.bold(app.version)}`);
            console.log(`     Root Directory: ${chalk.bold(app.rootDir)}`);
        });
    } catch (error: any) {
        console.error(chalk.red('Error: Failed to read or parse klave.json.', error.message));
        process.exit(1);
    }
};
