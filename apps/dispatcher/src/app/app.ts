import { FastifyInstance } from 'fastify';
import type { SocketStream } from '@fastify/websocket';
import { v4 as uuid } from 'uuid';

const definitions = process.env.KLAVE_DISPATCH_ENDPOINTS?.split(',') ?? [];
const endpoints = definitions.map(def => def.split('#') as [string, string]).filter(def => def.length === 2);
const connectionPool = new Map<string, SocketStream>();

/* eslint-disable-next-line */
export interface AppOptions { }

export async function app(fastify: FastifyInstance) {

    fastify.log.info(endpoints, 'Preparing for enpoints');

    fastify.get('/dev', { websocket: true }, (connection) => {
        connection.on('data', (data) => {
            if (data.toString() === process.env.KLAVE_DISPATCH_SECRET) {
                const id = uuid();
                connection.on('close', () => {
                    connectionPool.delete(id);
                });
                connection.on('error', () => {
                    connectionPool.delete(id);
                });
                connection.on('end', () => {
                    connectionPool.delete(id);
                });
                connectionPool.set(id, connection);
            }
        });
    });

    fastify.all('/hook', async (req, res) => {

        const newHeaders = { ...req.headers };
        delete newHeaders.connection;
        delete newHeaders.host;

        // We assume that the request is not too long
        // We assume that it is not a multipart request either
        const rawContent = Uint8Array.from(req.raw.read() ?? []);
        const responseRegister: Promise<[string, number]>[] = [];

        endpoints.forEach(([name, base]) => {
            responseRegister.push(new Promise(resolve => {
                setTimeout(() => {
                    resolve([name, 408]);
                }, 3000);
                fastify.log.debug(undefined, `Dispatching to ${name}`);
                fetch(base, {
                    method: req.method,
                    headers: newHeaders as Record<string, string>,
                    body: rawContent
                }).then((response) => {
                    fastify.log.debug(undefined, `Receiving response from ${name}`);
                    resolve([name, response.status]);
                }).catch(() => {
                    fastify.log.warn(undefined, `Failed to reach ${name}`);
                    resolve([name, 503]);
                });
            }));
        });

        connectionPool.forEach((connection, id) => {
            responseRegister.push(new Promise(resolve => {
                fastify.log.debug(undefined, `Dispatching to socket ${id}`);
                try {
                    connection.socket.send(JSON.stringify({
                        headers: newHeaders,
                        body: Array.from(rawContent)
                    }), (err) => {
                        if (err)
                            return resolve([id, 503]);
                        resolve([id, 200]);
                    });
                } catch (e) {
                    resolve([id, 503]);
                }
            }));
        });

        const statuses = ((await Promise.allSettled(responseRegister)).filter(status => status.status === 'fulfilled') as PromiseFulfilledResult<[string, number]>[])
            .map(({ value }) => value)
            .reduce((prev, [base, outcome]) => {
                prev[base] = outcome;
                return prev;
            }, {} as Record<string, number>);

        await res.status(Object.values(statuses).find(status => status === 200) ? 207 : 500)
            .send({ ok: true, statuses });

    });
}
