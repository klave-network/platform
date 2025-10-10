const { version } = require('./package.json');
const { current } = require('../../tools/scripts/gitInfo.mjs');

const gitInfo = current();

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : 'external',
    outExtension: {
        '.js': '.cjs'
    },
    define: {
        'process.env.NX_TASK_TARGET_PROJECT': JSON.stringify(process.env.NX_TASK_TARGET_PROJECT),
        'process.env.GIT_REPO_COMMIT': JSON.stringify(gitInfo.long),
        'process.env.GIT_REPO_BRANCH': JSON.stringify(gitInfo.branch),
        'process.env.GIT_REPO_DIRTY': JSON.stringify(gitInfo.isDirty),
        'process.env.GIT_REPO_VERSION': JSON.stringify(version)
    },
    target: ['node'],
    platform: 'node',
    loader: {
        // ensures .node binaries are copied to ./dist
        '.node': 'copy'
    }
};