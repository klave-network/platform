if (process.env.npm_execpath.indexOf('yarn') === -1) {
    console.error('We use yarn for installing! Check it out : https://yarnpkg.com/en/docs/install');
    process.exit(42);
}
