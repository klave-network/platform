import fs from 'fs-extra';
import * as p from '@clack/prompts';
import chalk from 'chalk';

/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 */
export async function confirmTargetDirAsync(targetDir: string): Promise<void> {
    const files = await fs.readdir(targetDir);

    if (files.length === 0) {
        return;
    }
    const shouldContinue = await p.confirm({
        message: `The target directory ${chalk.magenta(
            targetDir
        )} is not empty, do you want to continue anyway?`
    });

    if (p.isCancel(shouldContinue)) return process.exit();
}
