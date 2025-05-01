const git = require('git-rev-sync');
const { version } = require('./package.json');
// const { nodeExternalsPlugin } = require('esbuild-node-externals');

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    entryPoints: ['./src/index.ts', './src/compile.ts'],
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : 'external',
    // plugins: [
    //     nodeExternalsPlugin()
    // ],
    outExtension: {
        '.js': '.js'
    },
    define: {
        'process.env.NX_TASK_TARGET_PROJECT': JSON.stringify(process.env.NX_TASK_TARGET_PROJECT),
        'process.env.GIT_REPO_COMMIT': JSON.stringify(git.long()),
        'process.env.GIT_REPO_BRANCH': JSON.stringify(git.branch()),
        'process.env.GIT_REPO_DIRTY': JSON.stringify(git.isDirty()),
        'process.env.GIT_REPO_VERSION': JSON.stringify(version)
    }
};