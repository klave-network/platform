import { Command } from 'commander';
import chalk from 'chalk';
import { KLAVE_CYAN_BG } from '~/lib/constants';
import packageJson from '../package.json';
import { info } from '~/commands/info';

console.log(KLAVE_CYAN_BG(chalk.bold(` ${packageJson.name} `)), `v${packageJson.version}`, 'The honest-by-design platform.');
console.log();

const program = new Command();

program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .arguments('[path]');

program
    .addCommand(info());

program.parse(process.argv);
