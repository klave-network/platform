const git = require('git-rev-sync');
const { version } = require('./package.json');

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : 'external',
    outExtension: {
        '.js': '.js'
    },
    define: {
        'process.env.NX_TASK_TARGET_PROJECT': JSON.stringify(process.env.NX_TASK_TARGET_PROJECT),
        'process.env.GIT_REPO_COMMIT': JSON.stringify(git.long('.')),
        'process.env.GIT_REPO_BRANCH': JSON.stringify(git.branch('.')),
        'process.env.GIT_REPO_DIRTY': JSON.stringify(git.isDirty()),
        'process.env.GIT_REPO_VERSION': JSON.stringify(version)
    }
};