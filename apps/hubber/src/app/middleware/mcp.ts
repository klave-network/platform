import { RequestHandler } from 'express-serve-static-core';
import { v4 as uuid } from 'uuid';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpServerOps } from '@klave/providers';

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export const mcpMiddleware: RequestHandler = (req, res) => {
    void (async () => {
        try {
            const sessionId = req.headers['mcp-session-id'] as string | undefined;
            let transport: StreamableHTTPServerTransport;

            if (sessionId && transports[sessionId]) {
                // Reuse existing transport
                transport = transports[sessionId];
            } else if (!sessionId && isInitializeRequest(req.body)) {
                // New initialization request
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => uuid(),
                    onsessioninitialized: (sessionId) => {
                        // Store the transport by session ID
                        transports[sessionId] = transport;
                    }
                });

                // Clean up transport when closed
                transport.onclose = () => {
                    if (transport.sessionId) {
                        delete transports[transport.sessionId];
                    }
                };
                const server = await mcpServerOps.getServer();

                // Connect to the MCP server
                await server.connect(transport);
            } else {
                // Invalid request
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided'
                    },
                    id: null
                });
                return;
            }

            // Handle the request
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
            console.error('MCP Middleware Error:', error);
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32001,
                    message: 'Internal Server Error'
                },
                id: null
            });
        }
    })();
};
