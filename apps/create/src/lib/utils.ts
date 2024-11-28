import spawn from 'cross-spawn';
import githubUsername from 'github-username';
import path from 'node:path';
import fs from 'node:fs';

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

/**
 * Finds user's name by reading it from the git config.
 */
export async function findMyName(): Promise<string> {
    try {
        return spawn.sync('git', ['config', '--get', 'user.name']).stdout.toString().trim();
    } catch {
        return '';
    }
}

/**
 * Finds user's email by reading it from the git config.
 */
export async function findGitHubEmail(): Promise<string> {
    try {
        return spawn.sync('git', ['config', '--get', 'user.email']).stdout.toString().trim();
    } catch {
        return '';
    }
}

/**
 * Get the GitHub username from an email address if the email can be found in any commits on GitHub.
 */
export async function findGitHubProfileUrl(email: string): Promise<string> {
    try {
        const username = (await githubUsername(email)) ?? '';
        return `https://github.com/${username}`;
    } catch {
        return '';
    }
}

/**
 * Guesses the repository URL based on the author profile URL and the package slug.
 */
export async function guessRepoUrl(authorUrl: string, slug: string) {
    if (/^https?:\/\/github.com\/[^/]+/.test(authorUrl)) {
        //const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
        let normalizedSlug;
        if (slug === '.' || slug === './') {
            const parts = process.cwd().split(path.sep);
            normalizedSlug = parts[parts.length - 1];
        } else if (slug.startsWith('./') || slug.startsWith('../')) {
            const parts = slug.split('/');
            normalizedSlug = parts[parts.length - 1];
        }

        return `${authorUrl}/${normalizedSlug}`;
    }
    return '';
}
