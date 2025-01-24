import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';

// Resolve the directory of the current file
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const isDev = process.env.NODE_ENV === 'development';

// Resolve the path to the package.json file
const packageJsonPath = isDev
    ? path.resolve(dirname, '../../package.json')
    : path.resolve(dirname, '../package.json');

// Read the package.json file
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const PACKAGE_VERSION = packageJson.version;

export const PACKAGE_NAME = packageJson.name;

export const PACKAGE_DESCRIPTION = packageJson.description;

export const KLAVE_CYAN = chalk.hex('#00FFD5');

export const KLAVE_CYAN_BG = chalk.bgHex('#00FFD5');

export const KLAVE_DARK_BLUE = chalk.hex('#00021A');

export const KLAVE_LIGHT_BLUE = chalk.hex('#00BFFF');

export const DOCS_URL = 'https://docs.klave.com';

export const KLAVE_URL = 'https://klave.com';

export const KLAVE_PLATFORM_URL = 'https://app.klave.com/login';

export const KLAVE_JSON = 'klave.json';

export const DISCORD_URL = 'https://discord.gg/MkUxsVeqDW';

export type KLAVE_APP = {
    slug: string;
    description: string;
    version: string;
    rootDir: string;
};
