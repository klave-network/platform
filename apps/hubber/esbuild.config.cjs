const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');
const { version } = require('./package.json');
const { current } = require('../../tools/scripts/gitInfo.mjs');

const gitInfo = current();
const klaveSentryURL = process.env.KLAVE_SENTRY_DSN ? new URL(process.env.KLAVE_SENTRY_DSN) : null;

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    sourcemap: 'both',
    // minify: false,
    treeShaking: true,
    // keepNames: true,
    plugins: [
        // Put the Sentry esbuild plugin after all other plugins
        klaveSentryURL ? sentryEsbuildPlugin({
            url: `${klaveSentryURL.protocol}//${klaveSentryURL.host}`,
            org: process.env.KLAVE_SENTRY_ORG,
            project: process.env.KLAVE_SENTRY_PROJECT,
            authToken: process.env.KLAVE_SENTRY_AUTH_TOKEN,
            release: `klave@${JSON.stringify(version)}`
        }) : undefined
    ].filter(Boolean),
    target: ['node'],
    platform: 'node',
    loader: {
        // ensures .node binaries are copied to ./dist
        '.node': 'copy'
    },
    outExtension: {
        '.js': '.mjs'
    },
    define: {
        'process.env.NX_TASK_TARGET_PROJECT': JSON.stringify(process.env.NX_TASK_TARGET_PROJECT),
        'process.env.GIT_REPO_COMMIT': JSON.stringify(gitInfo.long),
        'process.env.GIT_REPO_BRANCH': JSON.stringify(gitInfo.branch),
        'process.env.GIT_REPO_DIRTY': JSON.stringify(gitInfo.isDirty),
        'process.env.GIT_REPO_VERSION': JSON.stringify(version)
    }
};