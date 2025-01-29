#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'child_process';
import os from 'os';

type Versions = {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};

/**
 * Print out environment information about the Klave project
 */
export const info = async () => {

    const { dependencies, devDependencies } = getVersions();

    console.log('Binaries:');
    console.log(`   Node: ${process.versions.node}`);
    console.log(`   npm: ${getBinaryVersion('npm')}`);
    console.log(`   Yarn: ${getBinaryVersion('yarn')}`);
    console.log(`   pnpm: ${getBinaryVersion('pnpm')}`);

    // Filter dependencies starting with "@klave/"
    const filterByScope = (deps: Record<string, string>) =>
        Object.entries(deps).filter(([name]) => name.startsWith('@klave/'));

    const klaveDependencies = filterByScope(dependencies);
    const klaveDevDependencies = filterByScope(devDependencies);

    console.log('Klave Packages:');
    const formattedDeps = [...klaveDependencies, ...klaveDevDependencies]
        .map(([ name, version ]) => `   ${name}: ${version}`)
        .join('\n');
    console.log(formattedDeps);

    console.log('Operating System:');
    console.log(`   Platform: ${os.platform()}`);
    console.log(`   Architecture: ${os.arch()}`);
    console.log(`   OS Version: ${os.version()}`);
};

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
