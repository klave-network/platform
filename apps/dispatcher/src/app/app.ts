import { FastifyInstance, RouteHandler } from 'fastify';
import type { WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import { collection } from '../utils/mongo';
import { config, getFinalParseUsage } from '@klave/constants';
import { concatUint8Arrays } from '../utils/uint-concat';

const definitions = config.get('KLAVE_DISPATCH_ENDPOINTS').split(',') ?? [];
const endpoints = definitions.map(def => def.split('#') as [string, string]).filter(def => def.length === 2);
const connectionPool = new Map<string, WebSocket>();

type WebSocketWithSecret = WebSocket & { id: string; secret: string };

/* eslint-disable-next-line */
export interface AppOptions { }

export async function app(fastify: FastifyInstance) {

    const __hostname = config.get('HOSTNAME', 'unknown');

    fastify.log.info(endpoints, 'Preparing for enpoints ');
    const secrets = config.get('KLAVE_DISPATCH_SECRETS').split(',') ?? [];

    fastify.get('/dev', { websocket: true }, (connection) => {
        connection.on('message', (data) => {
            if (secrets.includes(data.toString())) {
                const id = uuid();
                (connection as WebSocketWithSecret).id = id;
                (connection as WebSocketWithSecret).secret = data.toString();
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
            } else {
                connection.send(JSON.stringify({
                    ok: false,
                    message: 'Unauthorized'
                }), () => {
                    connection.close();
                });
            }
        });
    });

    const hookMiddleware: RouteHandler = async (req, res) => {

        const newHeaders = { ...req.headers };
        delete newHeaders.connection;
        delete newHeaders.host;

        // We assume that the request is not too long
        // We assume that it is not a multipart request either
        const rawContent = await new Promise<Uint8Array>((resolve) => {
            const chunks: Uint8Array[] = [];
            req.raw.on('readable', () => {
                let chunk: Uint8Array | null;
                while (null !== (chunk = req.raw.read())) {
                    chunks.push(chunk);
                }
            });
            req.raw.on('end', () => {
                const content = concatUint8Arrays(chunks);
                if (!content)
                    return;
                resolve(content);
            });
            req.raw.on('error', (err) => {
                fastify.log.error('Error reading hook body:', err);
            });
        });
        const responseRegister: Promise<[string, number]>[] = [];

        fastify.log.info(undefined, `Received hook request: ${req.method} ${req.url}`);
        fastify.log.info(undefined, `Headers: ${JSON.stringify(newHeaders)}`);
        fastify.log.info(undefined, `Raw content length: ${rawContent.length}`);
        console.log('Received hook request:', newHeaders['content-length'], rawContent.length);

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

        const familyMap: Record<string, true> = {};
        connectionPool.forEach((connection, id) => {
            if (familyMap[(connection as WebSocketWithSecret).secret])
                return;
            familyMap[(connection as WebSocketWithSecret).secret] = true;
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
                    console.error(e?.toString());
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

        await res
            .headers({ 'X-Klave-API-Node': __hostname })
            .status(!statusValues.length ? 200 : statusValues.find(status => status === 200) ? 207 : 500)
            .send({ ok: true, statuses });
    };

    fastify.all('/hook', hookMiddleware);
    fastify.all('/vcs/hook', hookMiddleware);

    fastify.all('/ingest/usage', async (req, res) => {
        const preRes = res.headers({ 'X-Klave-API-Node': __hostname });

        // We assume that the request is not too long
        // We assume that it is not a multipart request either
        const rawContent = Uint8Array.from(req.raw.read() ?? []);

        let data: NonNullable<ReturnType<typeof getFinalParseUsage>['data']>;
        try {
            const content = new TextDecoder('utf-8').decode(rawContent);
            if (typeof content !== 'string')
                return await preRes.status(400).send({ ok: false });
            const parseResult = getFinalParseUsage(content);
            if (parseResult.error)
                return await preRes.status(400).send({ ok: false });
            if (parseResult.data === undefined)
                return await preRes.status(400).send({ ok: false });
            data = parseResult.data;
        } catch (error) {
            fastify.log.error('Failed to parse the content', error);
            return await preRes.status(400).send({ ok: false });
        }
        if (!collection)
            return await preRes.status(202).send({ ok: true });
        await collection?.insertOne({
            type: 'usage',
            timestamp: new Date().toISOString(),
            data
        });
        return await preRes.status(201).send({ ok: true });
    });

    fastify.all('/version', async (__unusedReq, res) => {
        await res
            .headers({ 'X-Klave-API-Node': __hostname })
            .status(202).send({
                version: {
                    name: process.env.NX_TASK_TARGET_PROJECT,
                    commit: process.env.GIT_REPO_COMMIT?.substring(0, 8),
                    branch: process.env.GIT_REPO_BRANCH,
                    version: process.env.GIT_REPO_VERSION
                },
                node: __hostname
            });
    });

    fastify.all('*', async (__unusedReq, res) => {
        await res
            .headers({ 'X-Klave-API-Node': __hostname })
            .status(400)
            .send({ ok: false });
    });
}
