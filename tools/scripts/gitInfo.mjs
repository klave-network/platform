import { spawnSync } from 'node:child_process';

/**
 * Gets the current Git information.
 * @returns {{ 
 *   long: string, 
 *   branch: string, 
 *   isDirty: boolean 
 * }} The current Git information
 */
export const current = () => {

    const gitState = spawnSync('git', ['status', '--porcelain=v2', '--branch', '--show-stash'], { encoding: 'utf-8' });
    const long = gitState.stdout.match(/^# branch\.oid (.+)$/m)?.[1] ?? 'unknown';
    const branch = gitState.stdout.match(/^# branch\.head (.+)$/m)?.[1] ?? 'unknown';
    const isDirty = gitState.stdout.includes('\n1 ') || gitState.stdout.includes('\n2 ') || gitState.stdout.includes('\nstash@{');

    const statusData = {
        long,
        branch,
        isDirty
    }

    return statusData;
}