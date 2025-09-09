import WebSocket from 'ws';
import { logger } from './logger';
import { config } from '@klave/constants';
import { Utils } from '@secretarium/connector';

let reconnectAttempt = 0;
let pingInterval: NodeJS.Timeout | undefined = undefined;
let reconnectionTimeout: NodeJS.Timeout | undefined;
let shuttingDown = false;

const planReconnection = async () => {
    return new Promise((resolve) => {
        reconnectionTimeout ??= setTimeout(() => {
            clearTimeout(reconnectionTimeout);
            reconnectionTimeout = undefined;
            dispatchOps.initialize().then(resolve).catch(() => { return; });
        }, 3000);
    });
};

let hookHandler: (reqInfo: Pick<RequestInit, 'headers' | 'body'>) => void | undefined;
let hookSocket: WebSocket | undefined;

export const dispatchOps = {
    initialize: async () => {
        try {
            if (shuttingDown)
                return;

            const dispatcherWs = config.get('KLAVE_DISPATCH_WS', 'ws://klave.dispatch.127.0.0.1.nip.io:3334');
            const dispatcherSecret = config.get('KLAVE_DISPATCH_SECRET');

            if (!dispatcherSecret) {
                logger.error('Dispatcher secret is not set');
                return;
            }

            hookSocket = new WebSocket(dispatcherWs);
            hookSocket.addEventListener('open', () => {
                if (!hookSocket)
                    return;
                hookSocket.send(dispatcherSecret);
                logger.info(`Connected to dispatcher ${dispatcherWs}`);
                reconnectAttempt = 0;
                pingInterval = setInterval(() => {
                    if (!hookSocket)
                        return;
                    hookSocket.ping();
                }, 30000);
            });
            hookSocket.addEventListener('error', (event) => {
                (async () => {
                    logger.error(`Connection ${++reconnectAttempt} to dispatcher failed: ${event.message}`);
                    if (pingInterval)
                        clearInterval(pingInterval);
                    pingInterval = undefined;
                    await planReconnection();
                })()
                    .catch(() => { return; });
            });
            hookSocket.addEventListener('close', (event) => {
                (async () => {
                    logger.error(`Connection ${++reconnectAttempt} to dispatcher has been closed: ${event.code} ${event.reason}`);
                    if (pingInterval)
                        clearInterval(pingInterval);
                    pingInterval = undefined;
                    await planReconnection();
                })()
                    .catch(() => { return; });
            });
            hookSocket.addEventListener('message', (event) => {
                const message = JSON.parse(event.data.toString()) as {
                    headers: Record<string, string>;
                    body: Array<number>
                };
                let effectiveBody: BodyInit = Uint8Array.from(message.body);
                if (message.headers['content-type']?.includes('application/json') || message.headers['Content-Type']?.includes('application/json'))
                    effectiveBody = Utils.decode(Uint8Array.from(message.body)).toString();
                if (hookHandler)
                    hookHandler({
                        headers: message.headers,
                        body: effectiveBody
                    });
                else
                    logger.warn('No hook handler registered, dispatcher message will not be processed');
            });
        } catch (e) {
            console.error(e?.toString());
            await planReconnection();
        }
    },
    registerHookHandler: (handler: typeof hookHandler) => {
        hookHandler = handler;
    },
    stop: async () => {
        logger.info('Stopping dispatcher listener...');
        shuttingDown = true;
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = undefined;
        }
        if (reconnectionTimeout) {
            clearTimeout(reconnectionTimeout);
            reconnectionTimeout = undefined;
        }
        if (hookSocket) {
            hookSocket.close();
            hookSocket = undefined;
        }
        logger.info('Dispatcher listener stopped');
    }
};