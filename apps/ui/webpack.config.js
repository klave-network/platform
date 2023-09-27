const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

module.exports = composePlugins(
    withNx(),
    withReact(),
    (config) => {
        config.resolve.fallback = {
            'bufferutil': false,
            'buffer-util': false,
            'utf-8-validate': false,
            'zlib': false,
            'stream': false,
            'net': false,
            'tls': false,
            'crypto': 'crypto-browserify',
            'http': false,
            'https': false,
            'url': false
        };

        config.ignoreWarnings.push({
            module: /src\/styles.css/,
            message: /@import must precede all other statements/
        });

        return config;
    });
