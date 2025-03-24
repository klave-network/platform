import { KLAVE_CYAN_BG, KLAVE_LIGHT_BLUE } from '../lib/constants';
import chalk from 'chalk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import spawnAsync from '@expo/spawn-async';
import { createTerminalLink } from '../utils/helpers';
import { resolvePackageManager } from '../utils/resolve-package-manager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/**
 * Check if a command is available in the PATH
 */
async function isCommandAvailable(command: string): Promise<boolean> {
    try {
        const checkCmd = process.platform === 'win32'
            ? `where ${command}`
            : `which ${command}`;

        await execPromise(checkCmd);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Builds all applications in the project or a specific one if specified
 */
export const build = async ({ app }: { app?: string }) => {
    // Check if klave.json exists
    const klaveConfigPath = path.join(CWD, 'klave.json');

    if (!fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red('Error: klave.json file not found. Make sure you are in a Klave project.'));
        process.exit(1);
    }

    // Read the klave config
    const klaveConfig = JSON.parse(fs.readFileSync(klaveConfigPath, 'utf-8'));

    if (!klaveConfig.applications || !Array.isArray(klaveConfig.applications)) {
        console.error(chalk.red('Error: Invalid klave.json file structure.'));
        process.exit(1);
    }

    // Get the list of applications to build
    const appsToProcess = app
        ? klaveConfig.applications.filter((a: any) => a.slug === app || a.name === app)
        : klaveConfig.applications;

    if (appsToProcess.length === 0) {
        console.error(chalk.red(`Error: No applications found ${app ? `with name "${app}"` : ''}.`));
        process.exit(1);
    }

    console.log('\n');
    p.intro(KLAVE_CYAN_BG(chalk.bold.black(' Klave - The honest-by-design platform ')));
    p.note(`Building ${app ? `application "${app}"` : 'all applications'}`);

    const s = p.spinner();
    s.start(`Analyzing project structure`);

    // Check project structure to determine what we're building
    const hasPackageJson = fs.existsSync(path.join(CWD, 'package.json'));
    const hasCargoToml = fs.existsSync(path.join(CWD, 'Cargo.toml'));

    // Check if we have necessary tools installed
    const hasNode = await isCommandAvailable('node');
    const hasNpm = await isCommandAvailable('npm');
    const hasCargo = await isCommandAvailable('cargo');
    const hasCargoComponent = hasCargo ? await isCommandAvailable('cargo-component') : false;

    // Determine package manager if we need it
    let packageManager = '';
    if (hasPackageJson) {
        packageManager = resolvePackageManager();
    }

    s.stop('Project analysis complete');

    // Track build status for summary
    const buildResults: { app: string, success: boolean, type: string, time: number }[] = [];

    // Build each application
    for (const application of appsToProcess) {
        const appSlug = application.slug || application.name;
        const appDir = application.rootDir.startsWith('/')
            ? path.join(CWD, application.rootDir.substring(1))  // Remove leading slash
            : path.join(CWD, application.rootDir);

        if (!fs.existsSync(appDir)) {
            console.error(chalk.yellow(`Warning: Directory not found for app "${appSlug}" at ${appDir}`));
            buildResults.push({
                app: appSlug,
                success: false,
                type: 'unknown',
                time: 0
            });
            continue;
        }

        // Determine app type
        let appType = 'unknown';

        if (fs.existsSync(path.join(appDir, 'Cargo.toml'))) {
            appType = 'rust';
        } else if (fs.existsSync(path.join(appDir, 'tsconfig.json'))) {
            appType = 'typescript';
        }

        if (appType === 'unknown') {
            console.error(chalk.yellow(`Warning: Could not determine app type for "${appSlug}"`));
            buildResults.push({
                app: appSlug,
                success: false,
                type: appType,
                time: 0
            });
            continue;
        }

        const startTime = Date.now();
        s.start(`Building ${appType} app "${appSlug}"`);

        try {
            if (appType === 'rust') {
                // Check if Rust tools are available
                if (!hasCargo) {
                    throw new Error(
                        'Rust toolchain not found. Please install Rust from https://rustup.rs/'
                    );
                }

                if (!hasCargoComponent) {
                    throw new Error(
                        'cargo-component not found. Please install with: cargo install cargo-component'
                    );
                }

                // Check if wasm32 target is installed
                try {
                    await execPromise('rustup target list --installed');
                } catch (error) {
                    // If we can't check, just proceed and let cargo show any errors
                }

                // Build Rust application
                await spawnAsync('cargo', ['component', 'build', '--target', 'wasm32-unknown-unknown', '--release'], {
                    cwd: CWD,
                    stdio: 'inherit' // Show output to user
                });

                buildResults.push({
                    app: appSlug,
                    success: true,
                    type: appType,
                    time: Date.now() - startTime
                });
            } else if (appType === 'typescript') {
                // Check if Node.js tools are available
                if (!hasNode) {
                    throw new Error(
                        'Node.js not found. Please install Node.js from https://nodejs.org/'
                    );
                }

                // Build TypeScript application
                let buildCommand: string;
                let buildArgs: string[];

                if (packageManager === 'npm') {
                    buildCommand = 'npm';
                    buildArgs = ['run', 'build', '--', '--app', appSlug];
                } else if (packageManager === 'yarn') {
                    buildCommand = 'yarn';
                    buildArgs = ['build', '--app', appSlug];
                } else if (packageManager === 'pnpm') {
                    buildCommand = 'pnpm';
                    buildArgs = ['build', '--app', appSlug];
                } else {
                    buildCommand = 'npx';
                    buildArgs = ['asc', path.join(appDir, 'index.ts'), '--target', 'release'];
                }

                await spawnAsync(buildCommand, buildArgs, {
                    cwd: CWD,
                    stdio: 'inherit'
                });

                buildResults.push({
                    app: appSlug,
                    success: true,
                    type: appType,
                    time: Date.now() - startTime
                });
            }

            s.stop(`Successfully built ${appType} app "${appSlug}" in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        } catch (error) {
            s.stop(`Failed to build ${appType} app "${appSlug}"`);

            const errorMessage = (error as Error).message;
            console.error(chalk.red(`Error building "${appSlug}": ${errorMessage}`));

            // Provide helpful installation instructions based on error
            if (appType === 'rust') {
                if (!hasCargo) {
                    console.log(chalk.yellow(`
To install Rust:
  ${KLAVE_LIGHT_BLUE(chalk.bold(createTerminalLink('https://rustup.rs/', 'https://rustup.rs/')))}

  # Then add WebAssembly target
  ${KLAVE_LIGHT_BLUE(chalk.bold('rustup target add wasm32-unknown-unknown'))}

  # Install cargo-component
  ${KLAVE_LIGHT_BLUE(chalk.bold('cargo install cargo-component'))}
`));
                } else if (!hasCargoComponent) {
                    console.log(chalk.yellow(`
To install cargo-component:
  ${KLAVE_LIGHT_BLUE(chalk.bold('cargo install cargo-component'))}

  # Make sure you also have the WebAssembly target
  ${KLAVE_LIGHT_BLUE(chalk.bold('rustup target add wasm32-unknown-unknown'))}
`));
                } else if (errorMessage.includes('unknown target')) {
                    console.log(chalk.yellow(`
To add the WebAssembly target:
  ${KLAVE_LIGHT_BLUE(chalk.bold('rustup target add wasm32-unknown-unknown'))}
`));
                }
            }

            buildResults.push({
                app: appSlug,
                success: false,
                type: appType,
                time: Date.now() - startTime
            });
        }
    }

    // Show summary
    console.log('\n');
    p.note('Build Summary', chalk.bold('Results'));

    const total = buildResults.length;
    const successful = buildResults.filter(r => r.success).length;

    console.log(`${chalk.bold('Total:')} ${total} apps`);
    console.log(`${chalk.bold('Built successfully:')} ${successful} apps`);

    if (successful < total) {
        console.log(`${chalk.bold('Failed:')} ${total - successful} apps`);
    }

    // Detailed results
    console.log('\n' + chalk.bold('Details:'));
    for (const result of buildResults) {
        const status = result.success
            ? chalk.green('✓ Success')
            : chalk.red('✗ Failed');
        const time = result.success
            ? chalk.gray(`(${(result.time / 1000).toFixed(2)}s)`)
            : '';

        console.log(`${status} ${chalk.bold(result.app)} [${result.type}] ${time}`);
    }

    // Exit with error code if any builds failed
    if (successful < total) {
        process.exit(1);
    }
};
