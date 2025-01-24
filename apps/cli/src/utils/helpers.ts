import fs from 'fs-extra';
import terminalLink from 'terminal-link';

/**
 * Create terminalLink with fallback for unsupported terminals
 */
export function createTerminalLink(text: string, url: string) {
    return terminalLink(text, url, {
        fallback: (text, url) => `${text}: ${url}`
    });
}

/**
 * Checks whether the target directory is empty.
 */
export function isEmpty(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        return true;
    }

    return false;
}

/**
 * Checks whether the project name is valid.
 */
export function isValidName(projectName: string) {
    return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

/**
 * Converts a project name to a valid NPM package name.
 */
export function toValidName(projectName: string) {
    if (isValidName(projectName)) return projectName;

    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/^[._]/, '')
        .replace(/[^a-z\d\-~]+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
