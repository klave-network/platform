import { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';

const definitions = process.env.KLAVE_DISPATCH_ENDPOINTS?.split(',') ?? [];
const endpoints = definitions.map(def => def.split('#') as [string, string]).filter(def => def.length === 2);
const connectionPool = new Map<string, WebSocket>();

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
                    connection.send(JSON.stringify({
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

        const statusValues = Object.values(statuses);

        await res.status(!statusValues.length ? 200 : statusValues.find(status => status === 200) ? 207 : 500)
            .send({ ok: true, statuses });

    };

    fastify.all('/ingest/usage', async (__unusedReq, res) => {
        // TODO: Implement kredit storage
        await res.status(200).send({ ok: true });
    });

    fastify.all('/version', async (__unusedReq, res) => {
        await res.status(404).send({
            version: {
                name: process.env.NX_TASK_TARGET_PROJECT,
                commit: process.env.GIT_REPO_COMMIT?.substring(0, 8),
                branch: process.env.GIT_REPO_BRANCH,
                version: process.env.GIT_REPO_VERSION
            }
        });
    });
}
