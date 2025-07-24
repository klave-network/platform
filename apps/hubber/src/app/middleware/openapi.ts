import { RequestHandler } from 'express-serve-static-core';
import { createOpenApiExpressMiddleware, generateOpenApiDocument } from 'trpc-to-openapi';
import { createContext, router as appRouter } from '@klave/api';

export const openAPIMiddleware = createOpenApiExpressMiddleware({
    router: appRouter,
    createContext
}) as RequestHandler;

// Generate OpenAPI schema document
export const openAPIDocument = generateOpenApiDocument(appRouter, {
    title: 'Klave API',
    description: 'OpenAPI compliant REST API built using tRPC with Express',
    version: '0.0.1',
    baseUrl: 'https://klave.api.127.0.0.1.nip.io:3333/o',
    docsUrl: 'https://docs.klave.com',
    tags: []
});