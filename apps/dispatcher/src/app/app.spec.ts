import Fastify, { FastifyInstance } from 'fastify';
import { app } from './app';

describe('GET /', () => {
    let server: FastifyInstance;

    beforeEach(async () => {
        server = Fastify();
        await server.register(app);
    });

    it('should respond with a 404', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(response.json()).toEqual({ message: 'Route GET:/ not found', error: 'Not Found', statusCode: 404 });
    });

    it('should respond with a done statement', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/hook'
        });

        const parsedResponse = response.json();
        expect(parsedResponse).toMatchObject({ ok: true });
        expect(parsedResponse.statuses).toBeDefined();
    });
});
