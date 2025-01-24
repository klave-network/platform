import spawn from 'cross-spawn';
import githubUsername from 'github-username';
import spawnAsync from '@expo/spawn-async';
import * as p from '@clack/prompts';
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
        const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
        return `${authorUrl}/${normalizedSlug}`;
    }
    return '';
}

/**
 * Create an empty Git repository.
 */
export async function createGitRepoAsync(targetDir: string) {
    const s = p.spinner();
    s.start('Creating an empty Git repository');

    await spawnAsync('git', ['init'], {
        cwd: targetDir,
        stdio: 'ignore'
    });

    s.stop('Created an empty Git repository');
}
