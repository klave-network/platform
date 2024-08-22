export * from './compile';
export const version = process.env.GIT_REPO_VERSION;
export const git = {
    branch: process.env.GIT_REPO_BRANCH,
    commit: process.env.GIT_REPO_COMMIT,
    dirty: process.env.GIT_REPO_DIRTY
};