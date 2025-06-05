import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from './logger';
// import prettyBytes from 'pretty-bytes';
// import z from 'zod';

export const mcpServerOps = {
    getServer: async () => {
        logger.info('Configuring Klave BHDUI ObjectStore...');
        const server = new McpServer({
            name: 'klave-api-server',
            version: '0.0.1'
        });

        // Static resource
        server.resource(
            'config',
            'config://app',
            async (uri) => ({
                contents: [{
                    uri: uri.href,
                    text: 'App configuration here'
                }]
            })
        );

        // Dynamic resource with parameters
        server.resource(
            'user-profile',
            new ResourceTemplate('users://{userId}/profile', { list: undefined }),
            async (uri, { userId }) => ({
                contents: [{
                    uri: uri.href,
                    text: `Profile data for user ${userId}`
                }]
            })
        );

        server.resource(
            'application',
            new ResourceTemplate('apps://{appId}/info', { list: undefined }),
            async (uri, { appId }) => ({
                contents: [{
                    uri: uri.href,
                    text: `Information about application ${appId}`
                }]
            })
        );

        // server.tool(
        //     'deploy-app',
        //     {
        //         fqdn: z.string(),
        //         wasmB64: z.string()
        //     },
        //     async ({ fqdn, wasmB64 }) => {
        //         return {
        //             content: [{
        //                 type: 'text',
        //                 text: `Deploying app at ${fqdn} with WASM (${prettyBytes(wasmB64.length)})`
        //             }]
        //         };
        //     }
        // );

        // server.prompt(
        //     'list-deployments',
        //     {},
        //     () => ({
        //         messages: [{
        //             role: 'user',
        //             content: {
        //                 type: 'text',
        //                 text: 'Here is a list of deployments:\n\n'
        //             }
        //         }]
        //     })
        // );

        return server;
    }
};