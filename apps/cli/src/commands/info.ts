import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'child_process';
import os from 'os';

type Versions = {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};

export function info() {
    const infoCmd = new Command('info');

    infoCmd.description('output info about Klave, Node.js, and package man');
    infoCmd.action(() => {
        const { dependencies, devDependencies } = getVersions();

        console.log('Binaries:');
        console.log(`   Node.js Version: ${process.versions.node}`);
        console.log(`   npm Version: ${getBinaryVersion('npm')}`);
        console.log(`   Yarn Version: ${getBinaryVersion('Yarn')}`);
        console.log(`   pnpm Version: ${getBinaryVersion('pnpm')}`);

        // Filter dependencies starting with "@klave/"
        const filterByScope = (deps: Record<string, string>) =>
            Object.entries(deps).filter(([name]) => name.startsWith('@klave/'));

        const klaveDependencies = filterByScope(dependencies);
        const klaveDevDependencies = filterByScope(devDependencies);

        console.log('\nKlave Packages:');
        const formattedDeps = [...klaveDependencies, ...klaveDevDependencies]
            .map(([ name, version ]) => `   ${name}: ${version}`)
            .join('\n');
        console.log(formattedDeps);

        console.log('\nOperating System:');
        console.log(`   Platform: ${os.platform()}`);
        console.log(`   Architecture: ${os.arch()}`);
        console.log(`   OS Version: ${os.version()}`);
    });

    return infoCmd;
}

function getVersions(): Versions {
    try {
    // Check if package.json exists
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.error('Error: package.json not found in the current directory.');
            process.exit(1);
        }

        // Get versions of dependencies from package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = packageJson.dependencies || {};
        const devDependencies: Record<string, string> = packageJson.devDependencies || {};

        return {
            dependencies,
            devDependencies
        };
    } catch (error: any) {
        console.error('Error fetching versions:', error.message);
        process.exit(1);
    }
}

function getBinaryVersion(binaryName: string) {
    try {
        return execFileSync(binaryName, ['--version']).toString().trim();
    } catch {
        return 'N/A';
    }
}
