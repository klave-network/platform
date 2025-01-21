import * as p from '@clack/prompts';
import chalk from 'chalk';

// print a warning message to the console
export const warning = (message: string): void => {
    p.log.warn(chalk.yellow('? ') + chalk.bold(message));
};

// print a step message to the console
export const info = (message: string): void => {
    p.log.step(chalk.bold(message));
};

// print an error message to the console
export const error = (message: string): void => {
    p.log.error(chalk.bold(message));
};

// print a debug message to the console
export const debug = (message: string): void => {
    p.log.step(`${chalk.bgGray('[DEBUG]')} ${chalk.gray(message)}`);
};

// print a message to the console
export const log = (message: string): void => {
    p.log.message(message);
};
