/** @type {Record<string, import('http-proxy-middleware/dist/types').Options>} */
const options = {
    '/api': {
        target: 'http://127.0.0.1:3333',
        ws: true,
        secure: false
    }
};

module.exports = options;