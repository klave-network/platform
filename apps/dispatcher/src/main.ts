import Fastify from 'fastify';
import rateLimiter from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';
import { app } from './app/app';

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

(async () => {
    // Instantiate Fastify with some config
    const server = Fastify({
        logger: true,
        bodyLimit: 10485760
    });

    // Register skeleton plugins.
    await server.register(rateLimiter, {
        max: 100,
        timeWindow: '1 minute'
    });
    await server.register(helmet);
    await server.register(sensible);
    await server.register(websocket);

    // Register your application as a normal plugin.
    await server.register(app);

    // Plan for nasty error to show up
    server.setErrorHandler(function (error, __unusedRequest, reply) {
        // Log error
        this.log.error(error);
        // Send error response
        reply
            .status(409)
            .send({ ok: false })
            .then(() => { return; }, () => { return; });
    });

    // Start listening.
    server.listen({ port, host }, (err) => {
        if (err) {
            server.log.error(err);
        } else {
            console.log(`[ ready ] http://${host}:${port}`);
        }
    });
})()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });